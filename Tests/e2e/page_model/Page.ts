import { ReactSelector } from 'testcafe-react-selectors';

class Page {
    public dialog: Selector;
    public searchBox: Selector;
    public commandList: Selector;
    public commands: Selector;

    constructor() {
        this.dialog = ReactSelector('CommandBarDialog');

        this.searchBox = this.dialog.findReact('SearchBox');
        this.commandList = this.dialog.findReact('CommandList');
        this.commands = this.commandList.findReact('CommandListItem');
    }
}

export default new Page();
