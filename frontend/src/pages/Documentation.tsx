import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Book, Search, ChevronRight, Home } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface DocPage {
  id: string;
  title: string;
  path: string;
  description: string;
  difficulty?: string;
  timeEstimate?: string;
  tags?: string[];
  featured?: boolean;
}

interface DocSection {
  id: string;
  title: string;
  description: string;
  pages: DocPage[];
}

interface DocIndex {
  version: string;
  lastUpdated: string;
  sections: DocSection[];
  quickLinks: Array<{
    title: string;
    path: string;
    icon: string;
    color: string;
  }>;
}

export function Documentation() {
  const navigate = useNavigate();
  const [index, setIndex] = useState<DocIndex | null>(null);
  const [selectedPage, setSelectedPage] = useState<DocPage | null>(null);
  const [markdown, setMarkdown] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  // Load documentation index
  useEffect(() => {
    fetch('/docs/index.json')
      .then((res) => res.json())
      .then((data) => setIndex(data))
      .catch((err) => console.error('Failed to load docs index:', err));
  }, []);

  // Load markdown content when page selected
  useEffect(() => {
    if (selectedPage) {
      setIsLoading(true);
      fetch(selectedPage.path)
        .then((res) => res.text())
        .then((text) => {
          setMarkdown(text);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Failed to load markdown:', err);
          setMarkdown('# Error\n\nFailed to load documentation page.');
          setIsLoading(false);
        });
    }
  }, [selectedPage]);

  // Load README as default page
  useEffect(() => {
    if (index && !selectedPage) {
      fetch('/docs/README.md')
        .then((res) => res.text())
        .then((text) => setMarkdown(text))
        .catch(() => setMarkdown('# Welcome to ReqSploit Documentation'));
    }
  }, [index, selectedPage]);

  const handlePageSelect = (page: DocPage) => {
    setSelectedPage(page);
    setSearchQuery('');
  };

  const handleBackToIndex = () => {
    setSelectedPage(null);
    setSearchQuery('');
  };

  // Filter sections based on search
  const filteredSections = index?.sections.map((section) => ({
    ...section,
    pages: section.pages.filter(
      (page) =>
        page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
  })).filter((section) => section.pages.length > 0);

  return (
    <div className="min-h-screen bg-[#0A1929] flex flex-col">
      {/* Header */}
      <div className="bg-[#0D1F2D] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-white/10 rounded-lg transition text-white/60 hover:text-white"
              >
                <Home className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <Book className="w-6 h-6 text-blue-500" />
                <h1 className="text-xl font-bold text-white">Documentation</h1>
              </div>
            </div>

            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition text-white"
            >
              {showSidebar ? 'Hide' : 'Show'} Menu
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {showSidebar && (
          <div className="w-80 bg-[#0D1F2D] border-r border-white/10 overflow-auto">
            <div className="p-4">
              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#0A1929] text-white border border-white/20 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Back to index button */}
              {selectedPage && (
                <button
                  onClick={handleBackToIndex}
                  className="w-full mb-4 flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Index
                </button>
              )}

              {/* Quick Links */}
              {!searchQuery && !selectedPage && index && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-white/60 uppercase mb-3">Quick Links</h3>
                  <div className="space-y-1">
                    {index.quickLinks.slice(0, 6).map((link) => {
                      const page = index.sections
                        .flatMap((s) => s.pages)
                        .find((p) => p.path === link.path);
                      return page ? (
                        <button
                          key={link.path}
                          onClick={() => handlePageSelect(page)}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/10 text-white/80 hover:text-white rounded-lg transition text-sm text-left"
                        >
                          <span>{link.icon}</span>
                          <span>{link.title}</span>
                        </button>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Sections */}
              <div className="space-y-6">
                {filteredSections?.map((section) => (
                  <div key={section.id}>
                    <h3 className="text-xs font-semibold text-white/60 uppercase mb-2">
                      {section.title}
                    </h3>
                    <div className="space-y-1">
                      {section.pages.map((page) => (
                        <button
                          key={page.id}
                          onClick={() => handlePageSelect(page)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition text-sm text-left ${
                            selectedPage?.id === page.id
                              ? 'bg-blue-600 text-white'
                              : 'hover:bg-white/10 text-white/80 hover:text-white'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{page.title}</div>
                            {page.timeEstimate && (
                              <div className="text-xs text-white/60 mt-0.5">
                                {page.timeEstimate}
                              </div>
                            )}
                          </div>
                          {page.featured && (
                            <span className="ml-2 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                              ★
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 ml-2 flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {isLoading ? (
              <div className="space-y-6 py-12 animate-pulse">
                <div className="h-8 bg-white/5 rounded w-2/3" />
                <div className="h-4 bg-white/5 rounded w-full" />
                <div className="h-4 bg-white/5 rounded w-5/6" />
                <div className="h-4 bg-white/5 rounded w-4/6" />
                <div className="h-6 bg-white/5 rounded w-1/2 mt-8" />
                <div className="h-4 bg-white/5 rounded w-full" />
                <div className="h-4 bg-white/5 rounded w-3/4" />
              </div>
            ) : (
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-4xl font-bold text-white mb-6">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-3xl font-bold text-white mt-12 mb-4">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-2xl font-bold text-white mt-8 mb-3">{children}</h3>
                    ),
                    h4: ({ children }) => (
                      <h4 className="text-xl font-bold text-white mt-6 mb-2">{children}</h4>
                    ),
                    p: ({ children }) => (
                      <p className="text-white/80 mb-4 leading-relaxed">{children}</p>
                    ),
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        className="text-blue-400 hover:text-blue-300 underline"
                        target={href?.startsWith('http') ? '_blank' : undefined}
                        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                      >
                        {children}
                      </a>
                    ),
                    code: ({ inline, children, ...props }: any) =>
                      inline ? (
                        <code className="px-1.5 py-0.5 bg-white/10 text-blue-300 rounded text-sm font-mono">
                          {children}
                        </code>
                      ) : (
                        <code
                          className="block px-4 py-3 bg-[#0D1F2D] text-white rounded-lg text-sm font-mono overflow-x-auto"
                          {...props}
                        >
                          {children}
                        </code>
                      ),
                    pre: ({ children }) => (
                      <pre className="mb-4 rounded-lg overflow-hidden">{children}</pre>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside text-white/80 mb-4 space-y-2">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside text-white/80 mb-4 space-y-2">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => <li className="ml-4">{children}</li>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 text-white/70 italic">
                        {children}
                      </blockquote>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto mb-4">
                        <table className="w-full border-collapse">{children}</table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="border border-white/20 bg-white/5 px-4 py-2 text-left text-white font-semibold">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="border border-white/20 px-4 py-2 text-white/80">
                        {children}
                      </td>
                    ),
                  }}
                >
                  {markdown}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
