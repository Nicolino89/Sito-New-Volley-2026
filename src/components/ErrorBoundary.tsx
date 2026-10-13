import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public props: Props;
  public state: State = {
    hasError: false,
    error: null
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 font-inter">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-yellow via-amber-400 to-brand-yellow" />
            
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold font-sport uppercase tracking-wide text-white">
                Si è verificato un errore
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Si è verificato un problema imprevisto durante il caricamento di questa sezione. Ricarica la pagina o torna alla schermata iniziale.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-black/50 p-3 rounded-lg border border-zinc-800 text-left overflow-x-auto max-h-28">
                <p className="text-[11px] font-mono text-zinc-500 break-all">
                  {this.state.error.message || String(this.state.error)}
                </p>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 bg-brand-yellow hover:bg-yellow-400 text-black font-bold py-2.5 px-4 rounded-xl text-xs uppercase font-sport tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Ricarica</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-2.5 px-4 rounded-xl text-xs uppercase font-sport tracking-wider flex items-center justify-center gap-2 transition-all border border-zinc-700 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
