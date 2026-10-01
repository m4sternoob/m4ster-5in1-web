/* Small reusable heading block for each content section. */

type Props = {
  eyebrow: string;
  title: string;
  blurb?: string;
};

export default function SectionHeading({ eyebrow, title, blurb }: Props) {
  return (
    <div className="mb-12 max-w-2xl">
      <p className="mb-2 text-xs font-bold tracking-widest text-arcade uppercase">
        {eyebrow}
      </p>
      <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
        {title}
      </h2>
      {blurb && <p className="mt-3 text-slate-400">{blurb}</p>}
    </div>
  );
}
