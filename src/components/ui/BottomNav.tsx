import { Logo } from './Logo';

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-40">
      <div className="max-w-lg mx-auto px-4 flex items-center justify-center h-16">
        <Logo className="w-8 h-8 text-primary-500" />
      </div>
    </nav>
  );
}