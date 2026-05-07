import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="grid min-h-screen place-items-center bg-[#111] px-4 text-[#25262b]">
          <section className="w-full max-w-lg rounded-[2rem] bg-white p-6 text-center shadow-[0_24px_70px_rgba(37,38,43,0.18)]">
            <h1 className="text-2xl font-bold">FinTrack Pro could not start</h1>
            <p className="mt-3 rounded-2xl bg-[#fff3f2] px-4 py-3 text-sm text-[#ff4f45]">{this.state.error.message}</p>
            <p className="mt-3 text-sm text-stone-600">Run the Supabase complete setup SQL, then refresh the page.</p>
          </section>
        </div>
      );
    }
    return this.props.children;
  }
}
