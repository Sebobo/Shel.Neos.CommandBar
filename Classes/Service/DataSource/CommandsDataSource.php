<?php

declare(strict_types=1);

namespace Shel\Neos\CommandBar\Service\DataSource;

/*
 * This script belongs to the Neos CMS package "Shel.Neos.CommandBar".
 *
 * This package is Open Source Software. For the full copyright and license
 * information, please view the LICENSE file which was distributed with this
 * source code.
 */

use Neos\ContentRepository\Domain\Model\NodeInterface;
use Neos\Flow\I18n\Translator;
use Neos\Flow\Mvc\Routing\UriBuilder;
use Neos\Neos\Controller\Backend\MenuHelper;
use Neos\Neos\Service\DataSource\AbstractDataSource;
use Shel\Neos\CommandBar\Domain\Dto\CommandDto;
use Shel\Neos\CommandBar\Helper\TranslationHelper;

class CommandsDataSource extends AbstractDataSource
{

    static protected $identifier = 'shel-neos-commandbar-commands';

    public function __construct(
        private readonly MenuHelper $menuHelper,
        private readonly UriBuilder $uriBuilder,
        private readonly Translator $translator
    ) {
    }

    public function getData(NodeInterface $node = null, array $arguments = []): array
    {
        $this->uriBuilder->setRequest($this->controllerContext->getRequest()->getMainRequest());

        $sitesForMenu = array_reduce($this->menuHelper->buildSiteList($this->controllerContext),
            static function (array $carry, array $site) {
                if (!$site['uri']) {
                    return $carry;
                }
                $carry[$site['nodeName']] = new CommandDto(
                    $site['name'],
                    $site['name'],
                    '',
                    $site['uri'],
                    'globe'
                );
                return $carry;
            }, []);

        $modulesForMenu = array_reduce($this->menuHelper->buildModuleList($this->controllerContext),
            function (array $carry, array $module) {
                // Skip modules without submodules
                if (!$module['submodules']) {
                    return $carry;
                }
                $carry[$module['group']] = [
                    'name' => TranslationHelper::translateByShortHandString($module['label']),
                    'description' => TranslationHelper::translateByShortHandString($module['description']),
                    'icon' => $module['icon'],
                    'subCommands' => array_reduce($module['submodules'],
                        function (array $carry, array $submodule) {
                            if ($submodule['hideInMenu']) {
                                return $carry;
                            }
                            $carry[$submodule['module']] = new CommandDto(
                                $submodule['modulePath'],
                                TranslationHelper::translateByShortHandString($submodule['label']),
                                TranslationHelper::translateByShortHandString($submodule['description']),
                                $this->uriBuilder->uriFor(
                                    'index',
                                    ['module' => $submodule['modulePath']],
                                    'Backend\Module',
                                    'Neos.Neos'
                                ),
                                $submodule['icon'],
                            );
                            return $carry;
                        }, []),
                ];
                return $carry;
            }, []);

        $commands = [
            'modules' => [
                'name' => $this->translate('CommandDataSource.category.modules'),
                'description' => $this->translate('CommandDataSource.category.modules.description'),
                'icon' => 'puzzle-piece',
                'subCommands' => $modulesForMenu,
            ]
        ];

        // Only show site switch command if there is more than one site
        if (count($sitesForMenu) > 1) {
            $commands['sites'] = [
                'name' => $this->translate('CommandDataSource.category.sites'),
                'description' => $this->translate('CommandDataSource.category.sites.description'),
                'icon' => 'file',
                'subCommands' => $sitesForMenu,
            ];
        }

        return $commands;
    }

    protected function translate($id): string
    {
        return $this->translator->translateById($id, [], null, null, 'Main', 'Shel.Neos.CommandBar') ?? $id;
    }
}
