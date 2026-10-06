/**
 * Close and clear the VM's active Dash collaboration session
 * @param {VirtualMachine} vm The virtual machine whose session should be closed
 */
export default function (vm) {
    const session = vm.dashCollaboration;
    if (!session) return;
    vm.dashCollaboration = null;
    session.destroy();
    vm.emit('DASH_COLLABORATION_STATUS');
}
