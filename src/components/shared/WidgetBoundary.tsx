"use client";

import { Component, type ReactNode } from "react";

interface WidgetBoundaryProps {
  title: string;
  children: ReactNode;
}

export class WidgetBoundary extends Component<WidgetBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <p
          className="rounded-2xl border border-dashed border-line p-6 text-sm text-muted"
          role="status"
        >
          {this.props.title} is unavailable right now.
        </p>
      );
    }
    return this.props.children;
  }
}
