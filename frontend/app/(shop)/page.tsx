export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <section className="flex flex-col gap-4 py-16">
      <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
        Votre matériel de ski,
        <br />
        <span className="text-glacier">réservé en quelques clics.</span>
      </h1>
      <p className="max-w-xl text-lg text-muted">
        Le catalogue, la recherche par dates et le panier arrivent aux prochaines étapes.
      </p>
    </section>
  );
}
