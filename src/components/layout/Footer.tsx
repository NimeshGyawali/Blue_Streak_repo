export function Footer() {
  return (
    <footer className="bg-muted/50 border-t border-border py-6 text-center text-sm text-muted-foreground">
      <div className="container mx-auto px-4">
        <p>&copy; {new Date().getFullYear()} Yamaha Blue Streaks. All rights reserved.</p>
        <p className="mt-1">Ride with passion. Connect with community.</p>
      </div>
    </footer>
  );
}
