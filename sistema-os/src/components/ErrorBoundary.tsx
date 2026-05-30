import type React from "react";
import { Component } from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#090B10]">
          <div className="max-w-md w-full mx-4 p-6 rounded-[12px] border border-white/10 bg-white/5 shadow-[0_30px_80px_-40px_rgba(247,147,26,0.35)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <svg className="h-6 w-6 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Erro no Sistema</h2>
                <p className="text-sm text-white/70">Ocorreu um erro inesperado</p>
              </div>
            </div>
            
            {this.state.error && (
              <div className="mb-4 p-3 rounded-[8px] bg-red-500/10 border border-red-400/30">
                <p className="text-xs text-red-200 font-mono">{this.state.error.message}</p>
              </div>
            )}
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-[#003D7A] text-white rounded-[6px] font-medium hover:bg-[#002B52] transition-colors"
              >
                Recarregar Página
              </button>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="w-full px-4 py-2 border border-white/10 text-white/80 rounded-[6px] font-medium hover:bg-white/10 transition-colors"
              >
                Tentar Novamente
              </button>
              <button
                onClick={() => window.location.href = "/"}
                className="w-full px-4 py-2 text-white/70 rounded-[6px] font-medium hover:text-white transition-colors"
              >
                Voltar ao Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
