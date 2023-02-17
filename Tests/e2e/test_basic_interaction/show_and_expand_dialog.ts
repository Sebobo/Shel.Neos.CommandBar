import page from '../page_model/Page';

fixture('Basic interaction');

test('The plugin loads and shows the command bar dialog', async (t) => {
    await t.expect(page.dialog.exists).ok('The dialog should exist');
});

test('The search box is focused and entering text expands the dialog to show commands', async (t) => {
    await t.expect(page.searchBox.exists).ok('The searchbox should exist');
    await t.expect(page.commandList.filterVisible().exists).notOk('The command list should be hidden');
    await t
        .typeText(page.searchBox, 'home')
        .expect(page.searchBox.value)
        .eql('home', 'The searchbox should contain the text');
    await t.expect(page.commandList.filterVisible().exists).ok('The command list should be visible');
});
