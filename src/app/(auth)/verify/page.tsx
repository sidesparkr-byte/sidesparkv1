import { VerifyClient } from "@/app/(auth)/verify/verify-client";

type VerifyPageProps = {
  searchParams?: {
    email?: string;
    next?: string;
  };
};

export default function VerifyPage({ searchParams }: VerifyPageProps) {
  return <VerifyClient email={searchParams?.email} nextPath={searchParams?.next} />;
}
