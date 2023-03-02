import { Selector } from 'testcafe';

class Page {
    public dialog: Selector;
    public searchBox: Selector;
    public commandList: Selector;
    public commands: Selector;

    selectByTestId = (id: string, selector = '*') => Selector(selector).withAttribute('data-testid', id);

    constructor() {
        this.dialog = this.selectByTestId('CommandBarDialog', 'dialog');
        this.searchBox = this.selectByTestId('SearchBox', 'input');
        this.commandList = this.selectByTestId('CommandList', 'nav');
        this.commands = this.selectByTestId('CommandListItem', 'li');
    }
}

export default new Page();
