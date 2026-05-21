import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-red-100 p-4 mb-4">
            <span className="text-3xl">!</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Algo salió mal</h2>
          <p className="text-sm text-slate-500 mb-4 max-w-xs">
            Ocurrió un error inesperado. Intenta recargar la página.
          </p>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            className="cursor-pointer rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 transition-colors"
          >
            Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
