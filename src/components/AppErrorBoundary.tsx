import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";

type Props = {
  children: ReactNode;
  resetKey?: string;
  onRetry?: () => void;
};

type State = { hasError: boolean; message?: string };

function isChunkLoadError(error: unknown): boolean {
  const msg = (error instanceof Error ? error.message : String(error ?? "")).toLowerCase();
  return (
    msg.includes("failed to fetch dynamically imported module") ||
    msg.includes("importing a module script failed") ||
    msg.includes("error loading dynamically imported module") ||
    msg.includes("unable to preload css") ||
    msg.includes("loading chunk")
  );
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : "Unexpected render error",
    };
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, message: undefined });
    }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("[AppErrorBoundary] render failed", error, info.componentStack);
    if (typeof window !== "undefined" && isChunkLoadError(error)) {
      const key = `chunk-reload:${window.location.pathname}`;
      if (!window.sessionStorage.getItem(key)) {
        window.sessionStorage.setItem(key, "1");
        window.location.reload();
      }
    }
  }

  private retry = () => {
    this.setState({ hasError: false, message: undefined });
    this.props.onRetry?.();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory px-4">
        <div className="max-w-md text-center">
          <h1 className="font-display text-xl text-charcoal">This page didn't load</h1>
          <p className="mt-2 text-sm text-charcoal/60">
            A section failed to render. Try again or return home.
          </p>
          {this.state.message ? (
            <p className="mt-3 break-words text-xs text-charcoal/40">{this.state.message}</p>
          ) : null}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button
              onClick={this.retry}
              className="rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-white"
            >
              Try again
            </button>
            <Link
              to="/"
              onClick={this.retry}
              className="rounded-full border border-charcoal/15 bg-white px-5 py-2.5 text-sm font-medium text-charcoal"
            >
              Go home
            </Link>
          </div>
        </div>
      </div>
    );
  }
}
