"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const h2Class =
  "mt-7 border-b border-[#F5F5F5] pb-1.5 text-[15px] font-bold text-[#1A1A1A]";
const pClass = "mb-2 text-[13px] leading-[1.8] text-[#595959]";
const ulClass = "ml-4 mt-2 list-disc text-[13px] leading-[1.8] text-[#595959]";

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="-mx-4 -my-5 min-h-screen bg-white px-5 pb-[60px] pt-6 text-[#595959]">
      <div className="mx-auto max-w-[680px]">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 inline-flex min-h-11 items-center gap-1 rounded-none bg-transparent pr-3 text-sm text-[#1A1A1A]"
          aria-label="Back"
        >
          <ChevronLeft className="h-[22px] w-[22px]" />
          <span>Back</span>
        </button>

        <header>
          <p className="font-[var(--font-heading)] text-[22px] font-bold text-[#0039A6]">
            SideSpark
          </p>
          <h1 className="mt-1 text-base font-semibold text-[#1A1A1A]">
            Terms and Conditions
          </h1>
          <p className="mt-0.5 text-xs text-[#9A9A9A]">Last updated April 14, 2026</p>
          <div className="mb-6 mt-4 border-t border-[#E5E5E5]" />
        </header>

        <article>
          <h2 className={h2Class}>AGREEMENT TO OUR LEGAL TERMS</h2>
          <p className={pClass}>
            We are SideSpark, operated by FRM Ventures LLC, registered in Indiana,
            United States. We operate the website sidesparkv1bu.vercel.app
          </p>
          <p className={pClass}>
            SideSpark is a peer-to-peer campus marketplace exclusively for verified Butler
            University students. SideSpark connects buyers and sellers but is not a party
            to any transaction. All trades are conducted in person on or near Butler
            University campus. SideSpark does not process payments, hold funds, or
            guarantee any transaction. Users must hold a valid @butler.edu email address
            to create an account. SideSpark is owned and operated by FRM Ventures LLC, an
            Indiana limited liability company.
          </p>
          <p className={pClass}>
            By accessing the Services, you confirm you have read, understood, and agreed
            to be bound by these Terms. The Services are intended for users who are at
            least 18 years old.
          </p>

          <h2 className={h2Class}>1. OUR SERVICES</h2>
          <p className={pClass}>
            SideSpark is intended solely for currently enrolled Butler University students
            aged 18 or older. We do not knowingly collect information from anyone under
            18. If we become aware a user is under 18 we will immediately terminate that
            account. Contact sidesparkr@gmail.com to report suspected underage accounts.
          </p>

          <h2 className={h2Class}>2. INTELLECTUAL PROPERTY RIGHTS</h2>
          <p className={pClass}>
            We own all intellectual property rights in our Services including source code,
            software, and website designs. You may not copy, reproduce, or exploit any
            part of the Services for commercial purposes without our express written
            permission. By posting content on SideSpark you grant us a non-exclusive,
            royalty-free, worldwide license to display, reproduce, and distribute that
            content solely to operate and promote the platform.
          </p>

          <h2 className={h2Class}>3. USER REPRESENTATIONS</h2>
          <p className={pClass}>By using the Services you represent and warrant that:</p>
          <ul className={ulClass}>
            <li>All registration information you submit is true, accurate, and complete</li>
            <li>You will maintain the accuracy of your information</li>
            <li>You have the legal capacity to agree to these Terms</li>
            <li>You are not a minor in your jurisdiction</li>
            <li>You will not use automated means to access the Services</li>
            <li>You will not use the Services for any illegal purpose</li>
            <li>
              You are a currently enrolled Butler University student with a valid
              @butler.edu email address and will immediately stop using the Services if
              your enrollment ends
            </li>
          </ul>

          <h2 className={h2Class}>4. USER REGISTRATION</h2>
          <p className={pClass}>
            You agree to keep your password confidential and are responsible for all
            activity under your account. We reserve the right to remove any username at
            our sole discretion.
          </p>

          <h2 className={h2Class}>5. PRODUCTS</h2>
          <p className={pClass}>
            SideSpark is not the seller of any item or service listed on the platform. All
            products are listed, owned, and sold by individual users. SideSpark makes no
            representations about the accuracy, condition, or quality of any listed item
            or service.
          </p>

          <h2 className={h2Class}>6. PURCHASES AND PAYMENT</h2>
          <p className={pClass}>
            SideSpark does not process, handle, hold, or facilitate any payments between
            users during the current beta period. All payment arrangements are made
            directly between buyers and sellers outside of the platform.
          </p>
          <p className={pClass}>
            SideSpark&apos;s QR confirmation system records that an in-person exchange
            occurred but does not constitute proof of payment or transfer of ownership.
          </p>
          <p className={pClass}>
            SideSpark accepts no liability for failed payments, disputed payments, or any
            financial loss arising from transactions between users.
          </p>

          <h2 className={h2Class}>7. RETURN POLICY</h2>
          <p className={pClass}>
            All sales are final. SideSpark is not a party to any transaction and does not
            accept returns or process refunds. Any return arrangement is solely between
            buyer and seller. Buyers are strongly encouraged to inspect all items before
            confirming the exchange via QR scan. Once the QR handshake is completed the
            transaction is considered final.
          </p>

          <h2 className={h2Class}>8. PROHIBITED ACTIVITIES</h2>
          <p className={pClass}>You agree not to:</p>
          <ul className={ulClass}>
            <li>
              List or sell illegal items including drugs, prescription medications,
              weapons, or stolen property
            </li>
            <li>List or sell alcohol, tobacco, vaping products, or age-restricted items</li>
            <li>List or sell counterfeit or fraudulently misrepresented goods</li>
            <li>List or sell adult content or sexual services</li>
            <li>Misrepresent the condition or description of any listed item</li>
            <li>Harass, threaten, or discriminate against any other user</li>
            <li>
              Conduct meetups in private residences or non-public locations without mutual
              consent
            </li>
            <li>Share another user&apos;s personal information without their consent</li>
            <li>Create multiple accounts or accounts on behalf of another person</li>
            <li>Use the platform without a valid active @butler.edu email address</li>
            <li>List any item whose sale is prohibited under Indiana or US federal law</li>
            <li>
              Engage in transactions involving gift cards, cryptocurrency, or financial
              instruments
            </li>
            <li>Sell or transfer your profile to another person</li>
          </ul>

          <h2 className={h2Class}>9. USER GENERATED CONTRIBUTIONS</h2>
          <p className={pClass}>
            Users may upload photos, listing descriptions, profile information, and
            messages. By posting content you warrant that you own or have rights to it, it
            does not infringe third party rights, it is accurate, and it does not violate
            these Terms. We reserve the right to remove any user content at our sole
            discretion without notice.
          </p>

          <h2 className={h2Class}>10. CONTRIBUTION LICENSE</h2>
          <p className={pClass}>
            By posting content on SideSpark you grant FRM Ventures LLC a non-exclusive,
            royalty-free, worldwide, perpetual license to display, reproduce, and
            distribute that content to operate and promote SideSpark. You retain ownership
            of your content.
          </p>

          <h2 className={h2Class}>11. GUIDELINES FOR REVIEWS</h2>
          <p className={pClass}>
            Ratings may only be submitted after a completed QR-confirmed transaction.
            Ratings must reflect your genuine experience. You may not submit false,
            misleading, or retaliatory ratings. You may not offer incentives for positive
            ratings or threaten negative ratings to manipulate other users. We reserve the
            right to remove any rating at our sole discretion.
          </p>

          <h2 className={h2Class}>12. SERVICES MANAGEMENT</h2>
          <p className={pClass}>
            We reserve the right to monitor the Services, take action against violators,
            remove or restrict any content or user, and manage the Services to protect our
            rights and users.
          </p>

          <h2 className={h2Class}>13. PRIVACY POLICY</h2>
          <p className={pClass}>
            We care about data privacy. By using the Services you agree to be bound by our
            Privacy Policy. The Services are hosted in the United States.
          </p>

          <h2 className={h2Class}>14. COPYRIGHT INFRINGEMENTS</h2>
          <p className={pClass}>
            If you believe any material on the Services infringes your copyright contact
            us at sidesparkr@gmail.com with a description of the work, location of the
            infringing content, your contact information, and a good faith statement.
          </p>

          <h2 className={h2Class}>15. TERM AND TERMINATION</h2>
          <p className={pClass}>
            We reserve the right to deny access, terminate accounts, or remove content at
            any time at our sole discretion without notice. If your account is terminated
            you may not register a new account.
          </p>

          <h2 className={h2Class}>16. MODIFICATIONS AND INTERRUPTIONS</h2>
          <p className={pClass}>
            We reserve the right to change or remove the Services at any time without
            notice. We are not liable for any modification or discontinuance of the
            Services.
          </p>

          <h2 className={h2Class}>17. GOVERNING LAW</h2>
          <p className={pClass}>
            These Terms are governed by the laws of the State of Indiana, United States.
          </p>

          <h2 className={h2Class}>18. DISPUTE RESOLUTION</h2>
          <p className={pClass}>
            Informal Negotiations: Parties agree to first attempt to resolve any dispute
            informally for at least thirty (30) days. Send written notice to
            sidesparkr@gmail.com to begin.
          </p>
          <p className={pClass}>
            Binding Arbitration: Unresolved disputes will be resolved by binding
            arbitration under the American Arbitration Association Consumer Rules.
            Arbitration will take place in Indiana. If fees are deemed excessive we will
            pay them.
          </p>
          <p className={pClass}>
            Time Limit: No dispute may be commenced more than one (1) year after the cause
            of action arose.
          </p>
          <p className={pClass}>
            No Class Actions: All disputes must be on an individual basis only. You waive
            any right to participate in a class action lawsuit against SideSpark or FRM
            Ventures LLC.
          </p>

          <h2 className={h2Class}>19. CORRECTIONS</h2>
          <p className={pClass}>
            We reserve the right to correct any errors or omissions on the Services at any
            time without notice.
          </p>

          <h2 className={h2Class}>20. DISCLAIMER</h2>
          <p className={pClass}>
            THE SERVICES ARE PROVIDED AS-IS. TO THE FULLEST EXTENT PERMITTED BY LAW WE
            DISCLAIM ALL WARRANTIES. WE ARE NOT LIABLE FOR ANY PERSONAL INJURY OR PROPERTY
            DAMAGE RESULTING FROM YOUR USE OF THE SERVICES OR FROM ANY TRANSACTION
            BETWEEN USERS.
          </p>

          <h2 className={h2Class}>21. LIMITATIONS OF LIABILITY</h2>
          <p className={pClass}>
            WE WILL NOT BE LIABLE FOR ANY INDIRECT, CONSEQUENTIAL, OR PUNITIVE DAMAGES
            ARISING FROM YOUR USE OF THE SERVICES. OUR TOTAL LIABILITY FOR ANY CLAIM WILL
            NOT EXCEED THE LESSER OF: (A) THE AMOUNT PAID BY YOU TO US DURING THE SIX (6)
            MONTH PERIOD PRIOR TO THE CLAIM, OR (B) $100.00 USD.
          </p>

          <h2 className={h2Class}>22. INDEMNIFICATION</h2>
          <p className={pClass}>
            You agree to defend, indemnify, and hold harmless FRM Ventures LLC and its
            officers and employees from any loss, damage, or claim arising from your use
            of the Services, breach of these Terms, violation of any third party rights,
            any transaction you enter into through the platform, or any harm you cause to
            another user.
          </p>

          <h2 className={h2Class}>23. USER DATA</h2>
          <p className={pClass}>
            You are solely responsible for all data you transmit to the Services. We have
            no liability for any loss or corruption of your data.
          </p>

          <h2 className={h2Class}>24. ELECTRONIC COMMUNICATIONS</h2>
          <p className={pClass}>
            By using the Services you consent to receive electronic communications and
            agree that all notices provided electronically satisfy any legal writing
            requirement.
          </p>

          <h2 className={h2Class}>25. CALIFORNIA USERS AND RESIDENTS</h2>
          <p className={pClass}>
            California residents may contact the Complaint Assistance Unit of the
            California Department of Consumer Affairs at 1625 North Market Blvd., Suite N
            112, Sacramento, CA 95834 or at (800) 952-5210.
          </p>
          <p className={pClass}>
            SideSpark does not sell personal information to any third party. Submit
            privacy requests to sidesparkr@gmail.com. We respond within 45 days.
          </p>

          <h2 className={h2Class}>26. SIDESPARK MARKETPLACE DISCLAIMER</h2>
          <p className={pClass}>
            Platform as Connector: SideSpark connects verified Butler University students.
            SideSpark is not a retailer, broker, or party to any transaction. SideSpark
            does not own, inspect, or guarantee any item or service listed.
          </p>
          <p className={pClass}>
            In-Person Transactions: All transactions must occur in public locations on or
            near Butler University campus including the Student Union, campus Starbucks,
            and the university library. SideSpark is not responsible for any harm, injury,
            or loss that occurs during any meeting between users.
          </p>
          <p className={pClass}>
            Independent Services: Service providers are independent individuals, not
            employees or agents of SideSpark. SideSpark does not supervise or guarantee
            any services listed.
          </p>
          <p className={pClass}>
            Butler University Affiliation: SideSpark is an independent platform not
            affiliated with, endorsed by, or sponsored by Butler University. Butler
            University has no responsibility for any transactions that occur through
            SideSpark.
          </p>
          <p className={pClass}>
            Ratings Disclaimer: Star ratings reflect individual user experiences only.
            SideSpark does not guarantee the accuracy of any rating.
          </p>

          <h2 className={h2Class}>27. MISCELLANEOUS</h2>
          <p className={pClass}>
            These Terms constitute the entire agreement between you and FRM Ventures LLC.
            If any provision is found unenforceable the remaining provisions remain in
            full effect. We may assign our rights and obligations at any time.
          </p>

          <h2 className={h2Class}>28. CONTACT US</h2>
          <p className={pClass}>
            SideSpark / FRM Ventures LLC<br />
            730 Berkley Rd<br />
            Indianapolis, IN 46208<br />
            United States<br />
            Email: sidesparkr@gmail.com<br />
            Phone: 765-757-9442
          </p>
        </article>

        <p className="mt-10 text-center text-xs text-[#9A9A9A]">
          Questions? Email us at{" "}
          <a href="mailto:sidesparkr@gmail.com" className="text-[#9A9A9A] underline">
            sidesparkr@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}
