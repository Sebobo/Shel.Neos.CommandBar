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

use GuzzleHttp\Psr7\Uri;
use Neos\ContentRepository\Domain\Model\NodeInterface;
use Neos\Flow\Annotations as Flow;
use Neos\Flow\Http\Client\Browser;
use Neos\Flow\Http\Client\CurlEngine;
use Neos\Neos\Service\DataSource\AbstractDataSource;
use Shel\Neos\CommandBar\Domain\Dto\CommandDto;
use Shel\Neos\CommandBar\Exception;
use Symfony\Component\DomCrawler\Crawler;

class SearchNeosPackagesDataSource extends AbstractDataSource
{

    protected const MAX_RESULTS = 10;

    static protected $identifier = 'shel-neos-commandbar-search-neos-packages';

    /**
     * @var {enabled: bool, endpoint: string, queryParameter: string} array
     */
    #[Flow\InjectConfiguration('features.searchNeosPackages', 'Shel.Neos.CommandBar')]
    protected $settings;

    /**
     * @throws Exception
     */
    public function getData(\Neos\ContentRepository\Core\Projection\ContentGraph\Node $node = null, array $arguments = []): array
    {
        $query = $arguments['query'] ?? '';

        if (!$query || !$this->settings['enabled']) {
            return [];
        }

        $browser = new Browser();
        $browser->setRequestEngine(new CurlEngine());

        $endpoint = new Uri($this->settings['endpoint']);

        try {
            $result = $browser->request($endpoint->withQuery($this->settings['queryParameter'] . '=' . urlencode($query)));
        } catch (\Exception $e) {
            throw new Exception('Could not fetch search results from the Neos package repository', 1677901925, $e);
        }
        if ($result->getStatusCode() !== 200) {
            throw new Exception('Could not fetch search results from the Neos package repository', 1677901927);
        }

        try {
            $data = json_decode($result->getBody()->getContents(), true, 512, JSON_THROW_ON_ERROR);
        } catch (\Exception $e) {
            throw new Exception('Could not decode search results from the Neos package repository', 1682681305);
        }

        return array_reduce($data['results'] ?? [], static function (array $carry, array $package) {
            $commandId = 'result-' . preg_replace('/[^a-z0-9]/', '-', $package['title']);
            $carry[$commandId] = new CommandDto(
                $commandId,
                $package['title'],
                $package['description'],
                $package['link'],
                'external-link-alt',
                $package['latestVersion']
            );
            return $carry;
        }, []);
    }
}
