// components/footer.tsx
export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/70">
      <div className="container mx-auto px-4 py-10 md:px-6">
        <div className="glass-panel rounded-2xl p-6 text-center md:p-8">
          <p className="text-sm font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Interview Better
          </p>
          <h3 className="mt-2 text-xl font-semibold md:text-2xl">
            Build confidence with every round.
          </h3>
          <p className="mt-3 text-sm text-muted-foreground">
            © {new Date().getFullYear()} NovaTech. Start today. Build the future.
          </p>
        </div>
      </div>
    </footer>
  );
}