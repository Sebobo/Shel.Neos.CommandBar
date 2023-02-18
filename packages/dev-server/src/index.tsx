import React, { useCallback, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';

import { CommandBar, logger } from '@neos-commandbar/commandbar';

(() => {
    const initialContent = {
        pageA: [
            {
                nodeType: 'headline',
                text: 'Neos CommandBar Test',
            },
            {
                nodeType: 'text',
                text: 'Lorem ipsum blabla',
            },
        ],
        pageB: [
            {
                nodeType: 'headline',
                text: 'Welcome to page B',
            },
            {
                nodeType: 'text',
                text: 'Only the finest news',
            },
        ],
    };

    const IconComponent: React.FC<IconProps> = () => {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <path
                    fill="currentColor"
                    d="M509.5 184.6 458.9 32.8C452.4 13.2 434.1 0 413.4 0H272v192h238.7c-.4-2.5-.4-5-1.2-7.4zM240 0H98.6c-20.7 0-39 13.2-45.5 32.8L2.5 184.6c-.8 2.4-.8 4.9-1.2 7.4H240V0zM0 224v240c0 26.5 21.5 48 48 48h416c26.5 0 48-21.5 48-48V224H0z"
                />
            </svg>
        );
    };

    let favourites: CommandId[] = [];
    let recentCommands: CommandId[] = [];

    const userPreferencesService: UserPreferencesService = {
        getFavourites: () => [...favourites],
        setFavourites: async (commandIds: CommandId[]) => void (favourites = [...commandIds]),
        getRecentlyUsed: () => [...recentCommands],
        setRecentlyUsed: async (commandIds: CommandId[]) => void (recentCommands = [...commandIds]),
    };

    const App = () => {
        const [sideBarLeftOpen, setSideBarLeftOpen] = useState(false);
        const [sideBarRightOpen, setSideBarRightOpen] = useState(false);
        const [commandBarOpen, setCommandBarOpen] = useState(true);
        const [published, setPublished] = useState(false);
        const [content, setContent] = useState(initialContent);
        const [currentWebsite, setCurrentWebsite] = useState('pageA');

        const publishAll: CommandAction = useCallback(async () => {
            logger.debug('Publishing all');
            setPublished(true);
        }, []);

        const addContentElement = useCallback(async (page: string, nodeType: string, text: string) => {
            logger.debug('Adding more content to page ' + page);
            setContent((prev) => {
                return {
                    ...prev,
                    [page]: [
                        ...prev[page],
                        {
                            nodeType,
                            text,
                        },
                    ],
                };
            });
        }, []);

        const findDocument: CommandAction = useCallback(async () => {
            logger.debug('Find document ist not implemented yet');
            return {
                success: false,
            };
        }, []);

        // Create some fake commands for testing
        const commands: HierarchicalCommandList = useMemo(
            () => ({
                home: {
                    icon: 'home',
                    name: 'Home',
                    description: 'Sends you home',
                    action: async () => logger.debug('Go home'),
                },
                toggleLeftSidebar: {
                    icon: 'toggle-on',
                    name: 'Toggle left sidebar',
                    action: async () => setSideBarLeftOpen((prev) => !prev),
                },
                toggleRightSidebar: {
                    icon: 'toggle-on',
                    name: 'Toggle right sidebar',
                    action: async () => setSideBarRightOpen((prev) => !prev),
                },
                publishAll: {
                    icon: 'newspaper',
                    name: 'Publish all',
                    description: 'to current Workspace',
                    action: publishAll,
                },
                addNode: {
                    icon: 'plus',
                    name: 'Add content',
                    description: 'Add new content element to the current page',
                    action: async () => addContentElement(currentWebsite, 'text', 'Some more text'),
                },
                findDocument: {
                    icon: 'search',
                    name: 'Find page',
                    description: 'Search for a document and navigate to it',
                    action: findDocument,
                },
                sites: {
                    name: 'Sites',
                    icon: 'file',
                    description: 'Open another website in this Neos instance',
                    subCommands: {
                        pageA: {
                            name: 'Website A',
                            icon: 'globe',
                            action: async () => setCurrentWebsite('pageA'),
                        },
                        pageB: {
                            name: 'Website B',
                            icon: 'globe',
                            action: async () => setCurrentWebsite('pageB'),
                        },
                    },
                },
                modules: {
                    name: 'Modules',
                    icon: 'puzzle-piece',
                    description: 'Open a module',
                    subCommands: {
                        media: {
                            name: 'Media',
                            icon: 'camera',
                            description: 'Manage images and other assets',
                            action: async () => logger.debug('Opened the media module'),
                        },
                        workspaces: {
                            name: 'Workspaces',
                            icon: 'th-large',
                            description: 'Publish or discard changes in workspaces',
                            action: async () => logger.debug('Opened the workspaces module'),
                        },
                        history: {
                            name: 'History',
                            icon: 'calendar',
                            description: 'View historic changes to content',
                            action: async () => logger.debug('Opened the history module'),
                        },
                        redirects: {
                            name: 'Redirects',
                            icon: 'share',
                            description: 'Manage redirects for documents and assets',
                            action: async () => logger.debug('Opened the redirects module'),
                        },
                    },
                },
                dummyA: {
                    icon: 'question',
                    name: 'Dummy A',
                    description: 'Just a dummy for layout testing',
                    action: '#',
                },
                dummyB: {
                    icon: 'question',
                    name: 'Dummy B',
                    description: 'Just a dummy for layout testing',
                    action: '#',
                },
                dummyC: {
                    icon: 'question',
                    name: 'Dummy C',
                    description: 'Just a dummy for layout testing',
                    action: '#',
                },
                dummyD: {
                    icon: 'question',
                    name: 'Dummy D',
                    description: 'Just a dummy for layout testing',
                    action: '#',
                },
            }),
            []
        );

        return (
            <div className="app-grid">
                <header className="header">
                    <span>Neos commandbar test</span>
                    <button disabled={published}>Publish all</button>
                </header>
                {sideBarLeftOpen && (
                    <div id="sidebarLeft">
                        <h2>Left Sidebar</h2>
                        <ul>
                            <li>1. item</li>
                            <li>2. item</li>
                            <li>3. item</li>
                            <li>4. item</li>
                            <li>5. item</li>
                        </ul>
                        <button onClick={() => setSideBarLeftOpen(false)}>Close</button>
                    </div>
                )}
                {sideBarRightOpen && (
                    <div id="sidebarRight">
                        <h2>Right Sidebar</h2>
                        <ul>
                            <li>1. item</li>
                            <li>2. item</li>
                            <li>3. item</li>
                            <li>4. item</li>
                            <li>5. item</li>
                        </ul>
                        <button onClick={() => setSideBarRightOpen(false)}>Close</button>
                    </div>
                )}
                <div className="content">
                    {content[currentWebsite].map(({ nodeType, text }, index) =>
                        nodeType === 'headline' ? (
                            <h2 className="headline" key={index}>
                                {text}
                            </h2>
                        ) : (
                            <p className="text" key={index}>
                                {text}
                            </p>
                        )
                    )}
                </div>
                <CommandBar
                    commands={commands}
                    open={commandBarOpen}
                    toggleOpen={() => setCommandBarOpen((prev) => !prev)}
                    IconComponent={IconComponent}
                    userPreferencesService={userPreferencesService}
                />
            </div>
        );
    };

    ReactDOM.render(<App />, document.getElementById('app'));
})();
