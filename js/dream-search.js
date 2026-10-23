(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.DreamSearch = factory();
}(typeof window === 'undefined' ? this : window, function () {
    'use strict';
    function keywords(query) {
        return Array.from(new Set(String(query).trim().toLowerCase().split(/\s+/).filter(Boolean))).slice(0, 20);
    }
    function rank(entries, query) {
        var terms = keywords(query);
        if (!terms.length) return [];
        var phrase = String(query).trim().toLowerCase();
        return entries.map(function (entry, index) {
            var title = entry.title.toLowerCase(), content = entry.content.toLowerCase();
            var tags = (entry.tags || []).join(' ').toLowerCase(), categories = (entry.categories || []).join(' ').toLowerCase();
            if (!terms.every(function (term) { return [title, tags, categories, content].some(function (text) { return text.includes(term); }); })) return null;
            var score = title === phrase ? 500 : title.startsWith(phrase) ? 250 : title.includes(phrase) ? 180 : 0;
            terms.forEach(function (term) { score += title.includes(term) ? 50 : tags.includes(term) ? 25 : categories.includes(term) ? 15 : 1; });
            var type = terms.every(function (term) { return title.includes(term); }) ? '标题匹配' : terms.every(function (term) { return tags.includes(term); }) ? '标签匹配' : terms.every(function (term) { return categories.includes(term); }) ? '分类匹配' : '正文匹配';
            return {entry: entry, score: score, type: type, index: index};
        }).filter(Boolean).sort(function (a, b) { return b.score - a.score || a.index - b.index; });
    }
    function snippet(content, terms) {
        var lower = content.toLowerCase();
        var positions = terms.map(function (term) { return lower.indexOf(term); }).filter(function (position) { return position >= 0; });
        var start = Math.max(0, positions.length ? Math.min.apply(null, positions) - 25 : 0);
        var end = Math.min(content.length, start + 140);
        return (start ? '…' : '') + content.slice(start, end) + (end < content.length ? '…' : '');
    }
    return {keywords: keywords, rank: rank, snippet: snippet};
}));
