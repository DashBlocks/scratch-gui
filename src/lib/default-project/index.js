import projectData from './project-data';

/* eslint-disable import/no-unresolved */
import overrideDefaultProject from '!arraybuffer-loader!./override-default-project.sb3';
import DashBackdrop from '!raw-loader!./Dash Backdrop.svg';
import Dashy from '!raw-loader!./Dashy.svg';
import Dashy2 from '!raw-loader!./ffda3f9a80afaaa9dbe00292f892e46e.svg'
import Dashy3 from '!raw-loader!./d3f97e3555feeea9c292eb9a52c5d592.svg';
import Dashy4 from '!raw-loader!./a30c76b27d418899ffcabc35097ccfe7.svg';
/* eslint-enable import/no-unresolved */
import {TextEncoder} from '../tw-text-encoder';

const defaultProject = translator => {
    if (overrideDefaultProject.byteLength > 0) {
        return [{
            id: 0,
            assetType: 'Project',
            dataFormat: 'JSON',
            data: overrideDefaultProject
        }];
    }

    let _TextEncoder;
    if (typeof TextEncoder === 'undefined') {
        _TextEncoder = require('text-encoding').TextEncoder;
    } else {
        _TextEncoder = TextEncoder;
    }
    const encoder = new _TextEncoder();

    const projectJson = projectData(translator);
    return [{
        id: 0,
        assetType: 'Project',
        dataFormat: 'JSON',
        data: JSON.stringify(projectJson)
    }, {
        id: '667148438894e7f6a50bed01885f284a',
        assetType: 'ImageVector',
        dataFormat: 'SVG',
        data: encoder.encode(DashBackdrop)
    }, {
        id: '52054ba69ddc88a2b32de72ca9d4b502',
        assetType: 'ImageVector',
        dataFormat: 'SVG',
        data: encoder.encode(Dashy)
    }, {
        id: 'ffda3f9a80afaaa9dbe00292f892e46e',
        assetType: 'ImageVector',
        dataFormat: 'SVG',
        data: encoder.encode(Dashy2)
    }, {
        id: 'd3f97e3555feeea9c292eb9a52c5d592',
        assetType: 'ImageVector',
        dataFormat: 'SVG',
        data: encoder.encode(Dashy3)
    }, {
        id: 'a30c76b27d418899ffcabc35097ccfe7',
        assetType: 'ImageVector',
        dataFormat: 'SVG',
        data: encoder.encode(Dashy4)
    }];
};

export default defaultProject;
