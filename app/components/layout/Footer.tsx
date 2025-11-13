import { Link } from "react-router";

export function Footer() {
  return (
    <div>
      <div className="container">
        <div className="border-t mt-6 py-6 flex items-center justify-between text-sm text-muted-foreground">
          <div>
            &copy; {new Date().getFullYear()} Phenix Labs. All rights reserved.
          </div>
          <ul className="flex items-center gap-2">
            <li>
              <Link to="/terms" className="hover:text-black">Terms of Service</Link>
            </li>
            <li className="ml-4">
              <Link to="/privacy" className="hover:text-black">Privacy Policy</Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}