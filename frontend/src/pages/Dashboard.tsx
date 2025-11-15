import { useEffect, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useAuthStore } from '../stores/authStore';
import { useProxyStore } from '../stores/proxyStore';
import { useApiRequestsStore } from '../stores/apiRequestsStore';
import { ProxyControls } from '../components/ProxyControls';
import { RequestList } from '../components/RequestList';
import { RequestViewer } from '../components/RequestViewer';
import { AIAnalysisPanel } from '../components/AIAnalysisPanel';
import { ProjectManager } from '../components/ProjectManager';
import { InterceptPanel } from '../components/InterceptPanel';
import { Header } from '../components/Header';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Dashboard() {
  const { accessToken, _hasHydrated } = useAuthStore();
  const { loadStatus } = useProxyStore();
  const { fetchRequests, selectedRequest, setFilters } = useApiRequestsStore();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Collapsible panels state
  const [showProjects, setShowProjects] = useState(true);
  const [showRequests, setShowRequests] = useState(true);
  const [showAI, setShowAI] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenu, setMobileMenu] = useState<'projects' | 'requests' | 'viewer' | 'ai' | 'intercept'>('viewer');
  const [centerTab, setCenterTab] = useState<'history' | 'intercept'>('history');

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

  // Mobile view
  if (isMobile) {
    return (
      <div className="min-h-screen bg-deep-navy flex flex-col">
        <Header />

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
        </div>

        {/* Mobile Content */}
        <div className="flex-1 overflow-hidden">
          {mobileMenu === 'projects' && (
            <ProjectManager
              onSelectProject={setSelectedProjectId}
              selectedProjectId={selectedProjectId}
            />
          )}
          {mobileMenu === 'requests' && (
            <div className="flex flex-col h-full">
              <ProxyControls />
              <RequestList />
            </div>
          )}
          {mobileMenu === 'viewer' && <RequestViewer />}
          {mobileMenu === 'ai' && (
            <>
              {selectedRequest && <AIAnalysisPanel requestId={selectedRequest.id} />}
              {!selectedRequest && (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm p-4 text-center">
                  Select a request to run AI analysis
                </div>
              )}
            </>
          )}
          {mobileMenu === 'intercept' && <InterceptPanel />}
        </div>
      </div>
    );
  }

  // Desktop view with resizable panels
  return (
    <div className="min-h-screen bg-deep-navy flex flex-col">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Left Sidebar - Projects */}
          {showProjects && (
            <>
              <Panel defaultSize={20} minSize={15} maxSize={35}>
                <div className="h-full border-r border-white/10 flex flex-col">
                  <ProjectManager
                    onSelectProject={setSelectedProjectId}
                    selectedProjectId={selectedProjectId}
                  />
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
                  <ProxyControls />
                  <RequestList />
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
              <div className="flex border-b border-white/10 bg-[#0A1929]">
                <button
                  onClick={() => setCenterTab('history')}
                  className={`px-6 py-3 text-sm font-medium transition ${
                    centerTab === 'history'
                      ? 'text-blue-400 border-b-2 border-blue-600 bg-[#0D1F2D]'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                  }`}
                >
                  History
                </button>
                <button
                  onClick={() => setCenterTab('intercept')}
                  className={`px-6 py-3 text-sm font-medium transition ${
                    centerTab === 'intercept'
                      ? 'text-blue-400 border-b-2 border-blue-600 bg-[#0D1F2D]'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                  }`}
                >
                  Intercept
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-hidden">
                {centerTab === 'history' && <RequestViewer />}
                {centerTab === 'intercept' && <InterceptPanel />}
              </div>
            </div>
          </Panel>

          {/* Right Sidebar - AI Analysis */}
          {showAI && (
            <>
              <PanelResizeHandle className="w-1 bg-white/5 hover:bg-blue-500/30 transition cursor-col-resize" />
              <Panel defaultSize={20} minSize={15} maxSize={35}>
                <div className="h-full border-l border-white/10 flex flex-col">
                  {selectedRequest && <AIAnalysisPanel requestId={selectedRequest.id} />}
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
