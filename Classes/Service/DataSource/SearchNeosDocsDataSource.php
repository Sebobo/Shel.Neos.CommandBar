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

class SearchNeosDocsDataSource extends AbstractDataSource
{

    protected const MAX_RESULTS = 10;

    static protected $identifier = 'shel-neos-commandbar-search-neos-docs';

    /**
     * @var {enabled: bool, endpoint: string, queryParameter: string} array
     */
    #[Flow\InjectConfiguration('features.searchNeosDocs', 'Shel.Neos.CommandBar')]
    protected $settings;

    /**
     * @throws Exception
     */
    public function getData(NodeInterface $node = null, array $arguments = []): array
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
            throw new Exception('Could not fetch search results from the Neos documentation', 1676205990, $e);
        }
        if ($result->getStatusCode() !== 200) {
            throw new Exception('Could not fetch search results from the Neos documentation', 1676205993);
        }

        // TODO: Implement JSON API in Neos docs to simplify this and provide structured data
        $searchResults = $browser->getCrawler()->filterXPath('//div[contains(@class, "search-results")]//div[contains(@class, "search-result")]');

        $subCommands = [];
        $searchResults->slice(0, self::MAX_RESULTS)->each(function (Crawler $searchResult) use (
            &$subCommands,
            $endpoint
        ) {
            $linkTag = $searchResult->filter('a.title');
            $link = $linkTag->attr('href');
            // Make $link absolute if it is relative
            $link = str_starts_with($link, 'http') ? $link : $endpoint->withPath($link);
            $breadcrumbs = $searchResult->filter('a.breadcrumb')->extract(['_text']);
            $highlights = $searchResult->filter('.highlight')->extract(['_text']);
            $subCommands[] = new CommandDto(
                $linkTag->text(),
                implode("\n", $highlights),
                (string)$link,
                'external-link-alt',
                implode(' / ', $breadcrumbs)
            );
        });
        return $subCommands;
    }
}
