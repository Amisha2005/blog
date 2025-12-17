// components/footer.tsx
export function Footer() {
  return (
    <footer className="border-t py-12 mt-20">
      <div className="container px-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} NovaTech. Start today. Build the future.
      </div>
    </footer>
  );
}