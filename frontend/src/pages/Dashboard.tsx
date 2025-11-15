import { useEffect, useState, useCallback } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useAuthStore } from '../stores/authStore';
import { useProxyStore } from '../stores/proxyStore';
import { useApiRequestsStore } from '../stores/apiRequestsStore';
import { useRepeaterStore } from '../stores/repeaterStore';
import { useIntruderStore } from '../stores/intruderStore';
import { useLayoutPersistence } from '../hooks/useLayoutPersistence';
import { toast } from '../stores/toastStore';
import { ProxyControls } from '../components/ProxyControls';
import { RequestList } from '../components/RequestList';
import { RequestViewer } from '../components/RequestViewer';
import { AIAnalysisPanel } from '../components/AIAnalysisPanel';
import { ProjectManager } from '../components/ProjectManager';
import { InterceptPanel } from '../components/InterceptPanel';
import { RepeaterPanel } from '../components/RepeaterPanel';
import { DecoderPanel } from '../components/DecoderPanel';
import { IntruderPanel } from '../components/IntruderPanel';
import { Header } from '../components/Header';
import { ToastContainer } from '../components/ToastContainer';
import { KeyboardShortcutHelp } from '../components/KeyboardShortcutHelp';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useKeyboardShortcuts, type ShortcutAction } from '../hooks/useKeyboardShortcuts';

export function Dashboard() {
  const { accessToken, _hasHydrated } = useAuthStore();
  const { loadStatus } = useProxyStore();
  const { fetchRequests, selectedRequest, setFilters } = useApiRequestsStore();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Layout persistence
  const { layout, isLoaded, updatePanelVisibility, updateCenterTab } = useLayoutPersistence();

  // Collapsible panels state (initialized from persisted layout)
  const [showProjects, setShowProjects] = useState(layout.panelVisibility.showProjects);
  const [showRequests, setShowRequests] = useState(layout.panelVisibility.showRequests);
  const [showAI, setShowAI] = useState(layout.panelVisibility.showAI);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenu, setMobileMenu] = useState<'projects' | 'requests' | 'viewer' | 'ai' | 'intercept' | 'repeater' | 'decoder' | 'intruder'>('viewer');
  const [centerTab, setCenterTab] = useState<'history' | 'intercept' | 'repeater' | 'decoder' | 'intruder'>(layout.centerTab);

  // Update persisted layout when panel visibility changes
  useEffect(() => {
    if (isLoaded) {
      updatePanelVisibility({ showProjects, showRequests, showAI });
    }
  }, [showProjects, showRequests, showAI, isLoaded, updatePanelVisibility]);

  // Update persisted layout when center tab changes
  useEffect(() => {
    if (isLoaded) {
      updateCenterTab(centerTab);
    }
  }, [centerTab, isLoaded, updateCenterTab]);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load initial data (only after hydration complete)
  useEffect(() => {
    if (!_hasHydrated) return;

    loadStatus();
    if (accessToken) {
      fetchRequests(accessToken);
    }
  }, [_hasHydrated, loadStatus, fetchRequests, accessToken]);

  // Filter requests when project changes
  useEffect(() => {
    if (!_hasHydrated || !accessToken) return;

    setFilters({ projectId: selectedProjectId || undefined });
    fetchRequests(accessToken);
  }, [_hasHydrated, selectedProjectId, setFilters, fetchRequests, accessToken]);

  // Keyboard shortcuts handler
  const { toggleIntercept, session } = useProxyStore();
  const { createTab: createRepeaterTab } = useRepeaterStore();
  const { startDraft: startIntruderDraft } = useIntruderStore();

  const handleShortcut = useCallback((action: ShortcutAction) => {
    switch (action) {
      case 'toggle-intercept':
        const currentInterceptMode = session?.interceptMode || false;
        toggleIntercept(!currentInterceptMode);
        break;
      case 'send-to-repeater':
        if (selectedRequest) {
          setCenterTab('repeater');
          if (isMobile) setMobileMenu('repeater');

          // Create new repeater tab with selected request
          createRepeaterTab(`${selectedRequest.method} ${new URL(selectedRequest.url).pathname}`, {
            method: selectedRequest.method,
            url: selectedRequest.url,
            headers: selectedRequest.headers as Record<string, string>,
            body: selectedRequest.body || undefined,
          });

          toast.success('Sent to Repeater', `${selectedRequest.method} ${selectedRequest.url}`);
        }
        break;
      case 'open-decoder':
        setCenterTab('decoder');
        if (isMobile) setMobileMenu('decoder');
        break;
      case 'send-to-intruder':
        if (selectedRequest) {
          setCenterTab('intruder');
          if (isMobile) setMobileMenu('intruder');

          // Start new intruder draft with selected request
          startIntruderDraft({
            method: selectedRequest.method,
            url: selectedRequest.url,
            headers: selectedRequest.headers as Record<string, string>,
            body: selectedRequest.body || undefined,
          });

          toast.success('Sent to Intruder', `${selectedRequest.method} ${selectedRequest.url}`);
        }
        break;
      default:
        break;
    }
  }, [selectedRequest, isMobile, toggleIntercept, createRepeaterTab, startIntruderDraft, setCenterTab, setMobileMenu]);

  useKeyboardShortcuts(handleShortcut);

  // Mobile view
  if (isMobile) {
    return (
      <div className="min-h-screen bg-deep-navy flex flex-col">
        <Header />
        <ToastContainer />
        <KeyboardShortcutHelp />

        {/* Mobile Navigation */}
        <div className="flex border-b border-white/10 bg-[#0A1929]">
          <button
            onClick={() => setMobileMenu('projects')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition ${
              mobileMenu === 'projects' ? 'bg-blue-600/20 text-blue-400 border-b-2 border-blue-600' : 'text-gray-400'
            }`}
          >
            Projects
          </button>
          <button
            onClick={() => setMobileMenu('requests')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition ${
              mobileMenu === 'requests' ? 'bg-blue-600/20 text-blue-400 border-b-2 border-blue-600' : 'text-gray-400'
            }`}
          >
            Requests
          </button>
          <button
            onClick={() => setMobileMenu('viewer')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition ${
              mobileMenu === 'viewer' ? 'bg-blue-600/20 text-blue-400 border-b-2 border-blue-600' : 'text-gray-400'
            }`}
          >
            Viewer
          </button>
          <button
            onClick={() => setMobileMenu('ai')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition ${
              mobileMenu === 'ai' ? 'bg-blue-600/20 text-blue-400 border-b-2 border-blue-600' : 'text-gray-400'
            }`}
          >
            AI
          </button>
          <button
            onClick={() => setMobileMenu('intercept')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition ${
              mobileMenu === 'intercept' ? 'bg-blue-600/20 text-blue-400 border-b-2 border-blue-600' : 'text-gray-400'
            }`}
          >
            Intercept
          </button>
          <button
            onClick={() => setMobileMenu('repeater')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition ${
              mobileMenu === 'repeater' ? 'bg-blue-600/20 text-blue-400 border-b-2 border-blue-600' : 'text-gray-400'
            }`}
          >
            Repeater
          </button>
          <button
            onClick={() => setMobileMenu('decoder')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition ${
              mobileMenu === 'decoder' ? 'bg-blue-600/20 text-blue-400 border-b-2 border-blue-600' : 'text-gray-400'
            }`}
          >
            Decoder
          </button>
          <button
            onClick={() => setMobileMenu('intruder')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition ${
              mobileMenu === 'intruder' ? 'bg-blue-600/20 text-blue-400 border-b-2 border-blue-600' : 'text-gray-400'
            }`}
          >
            Intruder
          </button>
        </div>

        {/* Mobile Content */}
        <div className="flex-1 overflow-hidden">
          {mobileMenu === 'projects' && (
            <ErrorBoundary>
              <ProjectManager
                onSelectProject={setSelectedProjectId}
                selectedProjectId={selectedProjectId}
              />
            </ErrorBoundary>
          )}
          {mobileMenu === 'requests' && (
            <div className="flex flex-col h-full">
              <ErrorBoundary>
                <ProxyControls />
              </ErrorBoundary>
              <ErrorBoundary>
                <RequestList />
              </ErrorBoundary>
            </div>
          )}
          {mobileMenu === 'viewer' && (
            <ErrorBoundary>
              <RequestViewer />
            </ErrorBoundary>
          )}
          {mobileMenu === 'ai' && (
            <>
              {selectedRequest && (
                <ErrorBoundary>
                  <AIAnalysisPanel requestId={selectedRequest.id} />
                </ErrorBoundary>
              )}
              {!selectedRequest && (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm p-4 text-center">
                  Select a request to run AI analysis
                </div>
              )}
            </>
          )}
          {mobileMenu === 'intercept' && (
            <ErrorBoundary>
              <InterceptPanel />
            </ErrorBoundary>
          )}
          {mobileMenu === 'repeater' && (
            <ErrorBoundary>
              <RepeaterPanel />
            </ErrorBoundary>
          )}
          {mobileMenu === 'decoder' && (
            <ErrorBoundary>
              <DecoderPanel />
            </ErrorBoundary>
          )}
          {mobileMenu === 'intruder' && (
            <ErrorBoundary>
              <IntruderPanel />
            </ErrorBoundary>
          )}
        </div>
      </div>
    );
  }

  // Desktop view with resizable panels
  return (
    <div className="min-h-screen bg-deep-navy flex flex-col">
      <Header />
      <ToastContainer />
      <KeyboardShortcutHelp />

      <div className="flex-1 flex overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Left Sidebar - Projects */}
          {showProjects && (
            <>
              <Panel defaultSize={20} minSize={15} maxSize={35}>
                <div className="h-full border-r border-white/10 flex flex-col">
                  <ErrorBoundary>
                    <ProjectManager
                      onSelectProject={setSelectedProjectId}
                      selectedProjectId={selectedProjectId}
                    />
                  </ErrorBoundary>
                </div>
              </Panel>
              <PanelResizeHandle className="w-1 bg-white/5 hover:bg-blue-500/30 transition cursor-col-resize" />
            </>
          )}

          {/* Toggle Projects Button */}
          {!showProjects && (
            <button
              onClick={() => setShowProjects(true)}
              className="w-8 border-r border-white/10 bg-[#0A1929] hover:bg-white/5 transition flex items-center justify-center"
              title="Show Projects"
            >
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          )}

          {/* Middle - Proxy Controls & Requests */}
          {showRequests && (
            <>
              <Panel defaultSize={25} minSize={20} maxSize={40}>
                <div className="h-full border-r border-white/10 flex flex-col relative">
                  {showProjects && (
                    <button
                      onClick={() => setShowProjects(false)}
                      className="absolute top-2 left-2 z-10 p-1.5 bg-[#0A1929] hover:bg-white/10 rounded transition"
                      title="Hide Projects"
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                  <ErrorBoundary>
                    <ProxyControls />
                  </ErrorBoundary>
                  <ErrorBoundary>
                    <RequestList />
                  </ErrorBoundary>
                </div>
              </Panel>
              <PanelResizeHandle className="w-1 bg-white/5 hover:bg-blue-500/30 transition cursor-col-resize" />
            </>
          )}

          {/* Toggle Requests Button */}
          {!showRequests && (
            <button
              onClick={() => setShowRequests(true)}
              className="w-8 border-r border-white/10 bg-[#0A1929] hover:bg-white/5 transition flex items-center justify-center"
              title="Show Requests"
            >
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          )}

          {/* Center - Tabbed View: History / Intercept */}
          <Panel defaultSize={35} minSize={25}>
            <div className="h-full flex flex-col relative">
              {showRequests && (
                <button
                  onClick={() => setShowRequests(false)}
                  className="absolute top-2 left-2 z-10 p-1.5 bg-[#0A1929] hover:bg-white/10 rounded transition"
                  title="Hide Requests"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-400" />
                </button>
              )}
              {showAI && (
                <button
                  onClick={() => setShowAI(false)}
                  className="absolute top-2 right-2 z-10 p-1.5 bg-[#0A1929] hover:bg-white/10 rounded transition"
                  title="Hide AI Panel"
                >
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              )}

              {/* Tabs */}
              <div className="flex border-b border-white/10 bg-[#0A1929] overflow-x-auto scrollbar-thin">
                <button
                  onClick={() => setCenterTab('history')}
                  className={`px-4 py-2.5 text-xs font-medium transition whitespace-nowrap flex-shrink-0 ${
                    centerTab === 'history'
                      ? 'text-blue-400 border-b-2 border-blue-600 bg-[#0D1F2D]'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                  }`}
                >
                  History
                </button>
                <button
                  onClick={() => setCenterTab('intercept')}
                  className={`px-4 py-2.5 text-xs font-medium transition whitespace-nowrap flex-shrink-0 ${
                    centerTab === 'intercept'
                      ? 'text-blue-400 border-b-2 border-blue-600 bg-[#0D1F2D]'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                  }`}
                >
                  Intercept
                </button>
                <button
                  onClick={() => setCenterTab('repeater')}
                  className={`px-4 py-2.5 text-xs font-medium transition whitespace-nowrap flex-shrink-0 ${
                    centerTab === 'repeater'
                      ? 'text-blue-400 border-b-2 border-blue-600 bg-[#0D1F2D]'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                  }`}
                >
                  Repeater
                </button>
                <button
                  onClick={() => setCenterTab('decoder')}
                  className={`px-4 py-2.5 text-xs font-medium transition whitespace-nowrap flex-shrink-0 ${
                    centerTab === 'decoder'
                      ? 'text-blue-400 border-b-2 border-blue-600 bg-[#0D1F2D]'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                  }`}
                >
                  Decoder
                </button>
                <button
                  onClick={() => setCenterTab('intruder')}
                  className={`px-4 py-2.5 text-xs font-medium transition whitespace-nowrap flex-shrink-0 ${
                    centerTab === 'intruder'
                      ? 'text-blue-400 border-b-2 border-blue-600 bg-[#0D1F2D]'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                  }`}
                >
                  Intruder
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-hidden">
                {centerTab === 'history' && (
                  <ErrorBoundary>
                    <RequestViewer />
                  </ErrorBoundary>
                )}
                {centerTab === 'intercept' && (
                  <ErrorBoundary>
                    <InterceptPanel />
                  </ErrorBoundary>
                )}
                {centerTab === 'repeater' && (
                  <ErrorBoundary>
                    <RepeaterPanel />
                  </ErrorBoundary>
                )}
                {centerTab === 'decoder' && (
                  <ErrorBoundary>
                    <DecoderPanel />
                  </ErrorBoundary>
                )}
                {centerTab === 'intruder' && (
                  <ErrorBoundary>
                    <IntruderPanel />
                  </ErrorBoundary>
                )}
              </div>
            </div>
          </Panel>

          {/* Right Sidebar - AI Analysis */}
          {showAI && (
            <>
              <PanelResizeHandle className="w-1 bg-white/5 hover:bg-blue-500/30 transition cursor-col-resize" />
              <Panel defaultSize={20} minSize={15} maxSize={35}>
                <div className="h-full border-l border-white/10 flex flex-col">
                  {selectedRequest && (
                    <ErrorBoundary>
                      <AIAnalysisPanel requestId={selectedRequest.id} />
                    </ErrorBoundary>
                  )}
                  {!selectedRequest && (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                      Select a request to run AI analysis
                    </div>
                  )}
                </div>
              </Panel>
            </>
          )}

          {/* Toggle AI Button */}
          {!showAI && (
            <button
              onClick={() => setShowAI(true)}
              className="w-8 border-l border-white/10 bg-[#0A1929] hover:bg-white/5 transition flex items-center justify-center"
              title="Show AI Panel"
            >
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </PanelGroup>
      </div>
    </div>
  );
}
