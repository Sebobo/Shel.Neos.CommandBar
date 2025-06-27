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

use Neos\ContentRepository\Core\Projection\ContentGraph\Node;
use Neos\Flow\Http\Exception;
use Neos\Flow\I18n\Translator;
use Neos\Flow\Mvc\Routing\Exception\MissingActionNameException;
use Neos\Flow\Mvc\Routing\UriBuilder;
use Neos\Flow\Persistence\Exception\IllegalObjectTypeException;
use Neos\Neos\Controller\Backend\MenuHelper;
use Neos\Neos\Domain\Model\SiteNodeName;
use Neos\Neos\Service\BackendRedirectionService;
use Neos\Neos\Service\DataSource\AbstractDataSource;
use Shel\Neos\CommandBar\Domain\Dto\CommandDto;
use Shel\Neos\CommandBar\Helper\TranslationHelper;

class CommandsDataSource extends AbstractDataSource
{

    static protected $identifier = 'shel-neos-commandbar-commands';

    public function __construct(
        private readonly MenuHelper $menuHelper,
        private readonly UriBuilder $uriBuilder,
        private readonly Translator $translator,
        private readonly BackendRedirectionService $backendRedirectionService,
    ) {
    }

    /**
     * @throws Exception
     * @throws MissingActionNameException
     * @throws IllegalObjectTypeException
     */
    public function getData(
        Node $node = null,
        array $arguments = []
    ): array {
        $this->uriBuilder->setRequest($this->controllerContext->getRequest()->getMainRequest());

        $sitesForMenu = array_reduce(
            $this->menuHelper->buildSiteList($this->controllerContext),
            /** @param array{name: string, nodeName: SiteNodeName, uri: string, active: bool} $site */
            static function (array $carry, array $site) {
                if (!$site['uri']) {
                    return $carry;
                }
                $carry[$site['nodeName']->value] = new CommandDto(
                    $site['name'],
                    $site['name'],
                    '',
                    $site['uri'],
                    'globe'
                );
                return $carry;
            },
            []
        );

        $modulesForMenu = $this->getModuleCommands();

        $commands = [
            'preferred-start-module' => new CommandDto(
                'preferred-start-module',
                $this->translate('CommandDataSource.command.preferredStartModule'),
                $this->translate('CommandDataSource.command.preferredStartModule.description'),
                $this->backendRedirectionService->getAfterLoginRedirectionUri($this->controllerContext),
                'home'
            ),
            // TODO: Introduce group DTO
            'modules' => [
                'name' => $this->translate('CommandDataSource.category.modules'),
                'description' => $this->translate('CommandDataSource.category.modules.description'),
                'icon' => 'puzzle-piece',
                'subCommands' => $modulesForMenu,
            ]
        ];

        // Only show site switch command if there is more than one site
        if (count($sitesForMenu) > 1) {
            // TODO: Introduce group DTO
            $commands['sites'] = [
                'name' => $this->translate('CommandDataSource.category.sites'),
                'description' => $this->translate('CommandDataSource.category.sites.description'),
                'icon' => 'file',
                'subCommands' => $sitesForMenu,
            ];
        }

        return $commands;
    }

    protected function translate(string $id): string
    {
        try {
            return $this->translator->translateById($id, [], null, null, 'Main', 'Shel.Neos.CommandBar') ?? $id;
        } catch (\Exception) {
            return $id;
        }
    }

    protected function getModuleCommands(): mixed
    {
        return array_reduce(
            $this->menuHelper->buildModuleList($this->controllerContext),
            function (array $carry, array $module) {
                // Skip modules without submodules
                if (!$module['submodules']) {
                    return $carry;
                }

                // TODO: Introduce group DTO
                $carry[$module['group']] = [
                    'name' => TranslationHelper::translateByShortHandString($module['label']),
                    'description' => TranslationHelper::translateByShortHandString($module['description']),
                    'icon' => $module['icon'],
                    'subCommands' => array_reduce(
                        $module['submodules'],
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
                        },
                        []
                    ),
                ];
                return $carry;
            },
            []
        );
    }
}
