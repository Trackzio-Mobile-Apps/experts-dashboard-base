/**
 * React Router adapters that mirror the Next.js navigation APIs used in this app.
 * Keeps call sites (`router.push`, `Link href=`, `useSearchParams()`) working.
 */
import {
  Link as RouterLink,
  useNavigate,
  useLocation,
  useSearchParams as useRouterSearchParams,
  type LinkProps as RouterLinkProps,
} from "react-router-dom";
import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ForwardedRef,
  type ReactNode,
} from "react";

export { Outlet, Navigate, useParams } from "react-router-dom";

type AppLinkProps = Omit<RouterLinkProps, "to"> &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href?: string;
    to?: RouterLinkProps["to"];
    children?: ReactNode;
  };

export const Link = forwardRef(function Link(
  { href, to, children, ...rest }: AppLinkProps,
  ref: ForwardedRef<HTMLAnchorElement>,
) {
  const target = to ?? href ?? "/";
  return (
    <RouterLink ref={ref} to={target} {...rest}>
      {children}
    </RouterLink>
  );
});

export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (to: string) => {
      navigate(to);
    },
    replace: (to: string) => {
      navigate(to, { replace: true });
    },
    back: () => {
      navigate(-1);
    },
  };
}

export function usePathname(): string {
  return useLocation().pathname;
}

/** Next.js-compatible: returns URLSearchParams (not a tuple). */
export function useSearchParams(): URLSearchParams {
  const [params] = useRouterSearchParams();
  return params;
}
