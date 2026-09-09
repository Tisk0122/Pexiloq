import Link from 'next/link'

export function Logo() {
  return (
    <Link href="/" className="flex shrink-0 items-center" aria-label="Pexiloq home">
      <img src="/Pexiloq_Logo.png" alt="Pexiloq" width={1774} height={887} className="h-10 w-auto object-contain sm:h-12 md:h-14 lg:h-16" />
    </Link>
  )
}
