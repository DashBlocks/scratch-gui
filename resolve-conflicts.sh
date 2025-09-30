#!/bin/bash

# Auto-resolve all image conflicts as 'ours'
git ls-files -u | awk '{print $4}' | sort -u | grep -E '\.(png|jpg|jpeg|gif|svg|webp|bmp|ico)$' | xargs -r git checkout --ours

echo "All image conflicts resolved as 'ours'"
echo "Now resolving non-image conflicts..."

non_image_files=( $(git ls-files -u | awk '{print $4}' | sort -u | grep -vE '\.(png|jpg|jpeg|gif|svg|webp|bmp|ico)$') )

if [ ${#non_image_files[@]} -eq 0 ]; then
    echo "No non-image conflicts found"
    exit 0
fi

for f in "${non_image_files[@]}"; do
    while grep -q '^<<<<<<< ' "$f"; do
        hunk_start=$(grep -n '^<<<<<<< ' "$f" | head -n1 | cut -d: -f1)
        echo
        echo "File: $f"
        echo "Conflict starts at line: $hunk_start"
        # Print the hunk
        awk -v start="$hunk_start" 'NR>=start {print; if (/^>>>>>>> /) exit}' "$f"
        while true; do
            echo "Options:"
            echo "  c = ours (your branch, current, above =======)"
            echo "  i = theirs (incoming/upstream branch, below =======)"
            echo "  b = both (keep both, remove conflict markers)"
            echo "  cp = compare (show hunk again)"
            echo "  ac = all ours (resolve all hunks in this file as ours)"
            echo "  ai = all theirs (resolve all hunks in this file as theirs)"
            read -p "Choose resolution for $f (line $hunk_start): " ans
            case $ans in
                c|C)
                    # Keep ours (your branch, current, above =======)
                    awk -v start="$hunk_start" '
                        BEGIN { state=0 }
                        NR < start { print; next }
                        NR == start { state=1; next }
                        state==1 && /^=======$/ { state=2; next }
                        state==1 { print; next }
                        state==2 && /^>>>>>>> / { state=0; next }
                        state==2 { next }
                        state==0 { print }
                    ' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
                    break;;
                i|I)
                    # Keep theirs (incoming/upstream branch, below =======)
                    awk -v start="$hunk_start" '
                        BEGIN { state=0 }
                        NR < start { print; next }
                        NR == start { state=1; next }
                        state==1 && /^=======$/ { state=2; next }
                        state==1 { next }
                        state==2 && /^>>>>>>> / { state=0; next }
                        state==2 { print; next }
                        state==0 { print }
                    ' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
                    break;;
                b|B)
                    # Keep both (remove conflict markers, keep both sections)
                    awk -v start="$hunk_start" '
                        BEGIN { state=0 }
                        NR < start { print; next }
                        NR == start { state=1; next }
                        state==1 && /^=======$/ { state=2; next }
                        state==1 { print; next }
                        state==2 && /^>>>>>>> / { state=0; next }
                        state==2 { print; next }
                        state==0 { print }
                    ' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
                    break;;
                cp|CP)
                    # Show the hunk again for review
                    echo "--- Ours (above =======), Theirs (below) ---"
                    awk -v start="$hunk_start" 'NR>=start {print; if (/^>>>>>>> /) exit}' "$f"
                    ;;
                ac|AC)
                    while grep -q '^<<<<<<< ' "$f"; do
                        hunk_start2=$(grep -n '^<<<<<<< ' "$f" | head -n1 | cut -d: -f1)
                        awk -v start="$hunk_start2" '
                            BEGIN { state=0 }
                            NR < start { print; next }
                            NR == start { state=1; next }
                            state==1 && /^=======$/ { state=2; next }
                            state==1 { print; next }
                            state==2 && /^>>>>>>> / { state=0; next }
                            state==2 { next }
                            state==0 { print }
                        ' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
                    done
                    break 2;;
                ai|AI)
                    while grep -q '^<<<<<<< ' "$f"; do
                        hunk_start2=$(grep -n '^<<<<<<< ' "$f" | head -n1 | cut -d: -f1)
                        awk -v start="$hunk_start2" '
                            BEGIN { state=0 }
                            NR < start { print; next }
                            NR == start { state=1; next }
                            state==1 && /^=======$/ { state=2; next }
                            state==1 { next }
                            state==2 && /^>>>>>>> / { state=0; next }
                            state==2 { print; next }
                            state==0 { print }
                        ' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
                    done
                    break 2;;
                *)
                    echo "Please enter c, i, b, cp, ac, or ai.";;
            esac
        done
    done

done

echo
 echo "Done. You can now run: git add . && git commit"