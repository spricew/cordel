'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';
import { Fragment, useRef } from 'react';
import type { ReactNode } from 'react';

import { ProductPreview } from './ProductPreview';
import { ArrowRightIcon, CheckIcon, OrganizationsIcon, RolesIcon, TeamsIcon } from './icons';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const HERO_LINES = ['Trabajo sereno.', 'Estructura clara.'];

/**
 * Titular del hero dividido por caracteres.
 *
 * La animación vive en CSS (`.hero-char`) para que arranque en el primer frame,
 * sin depender de la hidratación ni provocar un flash de texto. El h1 conserva
 * el texto completo como nombre accesible y los caracteres quedan ocultos a
 * lectores de pantalla para que no se deletree letra a letra.
 */
function HeroTitle() {
  let charIndex = 0;

  return (
    <h1 aria-label={HERO_LINES.join(' ')} className="text-display-xl text-primary">
      <span aria-hidden="true">
        {HERO_LINES.map((line, lineIndex) => {
          const words = line.split(' ');

          return (
            <Fragment key={line}>
              <span className="block">
                {words.map((word, wordIndex) => (
                  <Fragment key={word}>
                    <span className="inline-block whitespace-nowrap">
                      {Array.from(word).map((char) => {
                        const delay = 60 + charIndex * 14;
                        charIndex += 1;

                        return (
                          <span
                            key={`${char}-${charIndex}`}
                            className="hero-char"
                            style={{ animationDelay: `${delay}ms` }}
                          >
                            {char}
                          </span>
                        );
                      })}
                    </span>
                    {wordIndex < words.length - 1 ? ' ' : null}
                  </Fragment>
                ))}
              </span>
              {lineIndex < HERO_LINES.length - 1 ? ' ' : null}
            </Fragment>
          );
        })}
      </span>
    </h1>
  );
}

const features: { icon: ReactNode; title: string; copy: string }[] = [
  {
    icon: <OrganizationsIcon />,
    title: 'Una cuenta, varias organizaciones',
    copy: 'Cambia de contexto sin mezclar datos. Cada organización mantiene sus equipos, sus miembros y su propio pulso.',
  },
  {
    icon: <TeamsIcon />,
    title: 'Equipos con su propio espacio',
    copy: 'Cada equipo tiene su gente, sus tareas y sus prioridades. Lo que ocurre en uno no contamina a otro.',
  },
  {
    icon: <RolesIcon />,
    title: 'Roles sin ambigüedad',
    copy: 'Permisos definidos en la organización y en el equipo, con una regla clara cuando los dos aplican.',
  },
];

const isolationPoints = [
  'Cada equipo es un límite de datos.',
  'Los permisos se evalúan en cada nivel.',
  'La base de datos impide cruces entre equipos.',
];

const roleCards = [
  {
    level: 'Organización',
    title: 'La estructura',
    copy: 'Define quién administra la organización, quién invita y quién participa. El rol de organización gobierna el marco completo.',
    scope: 'Alcance global',
  },
  {
    level: 'Equipo',
    title: 'El trabajo',
    copy: 'Gobierna el día a día del equipo. Cuando una persona tiene rol en ambos niveles, el del equipo es el que manda.',
    scope: 'Tiene prioridad',
  },
];

function SectionHeading({
  id,
  title,
  copy,
  align = 'left',
}: {
  id: string;
  title: string;
  copy: string;
  align?: 'left' | 'center';
}) {
  const centered = align === 'center';

  return (
    <div className={centered ? 'flex flex-col items-center gap-4 text-center' : 'flex flex-col gap-4'}>
      <h2
        id={id}
        className={`max-w-3xl text-balance text-display-lg text-primary ${centered ? 'mx-auto' : ''}`}
      >
        {title}
      </h2>
      <p className={`max-w-2xl text-body-lg text-muted ${centered ? 'mx-auto' : ''}`}>{copy}</p>
    </div>
  );
}

function IsolationDiagram() {
  const teams = [
    { name: 'Producto', tasks: ['Brief de campaña', 'Revisión de diseño'] },
    { name: 'Ingeniería', tasks: ['Deploy de staging', 'Revisión de API'] },
  ];

  return (
    <div aria-hidden="true" className="relative">
      <div className="rounded-xl border border-border bg-surface p-5 shadow-level-3">
        <div className="flex items-center justify-between">
          <span className="text-label-sm uppercase tracking-caps text-muted">Organización</span>
          <span className="text-label-md text-primary">Acme</span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {teams.map((team) => (
            <div
              key={team.name}
              className="rounded-lg border border-dashed border-sage-soft bg-panel p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-label-md text-primary">{team.name}</span>
                <span className="h-2 w-2 rounded-full bg-sage" />
              </div>
              <div className="mt-4 flex flex-col gap-2">
                {team.tasks.map((task) => (
                  <div
                    key={task}
                    className="flex items-center gap-2 rounded-md bg-surface px-2.5 py-2"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-outline-variant" />
                    <span className="text-body-sm leading-snug text-muted">{task}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-5 text-center text-data-sm text-text-subtle">
          Cada equipo, un límite de datos
        </p>
      </div>
    </div>
  );
}

export function Landing() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const scope = root.current;
        if (!scope) return;

        const reveals = gsap.utils.toArray<HTMLElement>('[data-reveal]', scope);
        gsap.set(reveals, { autoAlpha: 0, y: 24 });

        ScrollTrigger.batch(reveals, {
          start: 'top 88%',
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, {
              autoAlpha: 1,
              y: 0,
              duration: 0.8,
              ease: 'power2.out',
              stagger: 0.08,
              overwrite: true,
            }),
        });

        gsap.to('[data-preview]', {
          yPercent: -5,
          ease: 'none',
          scrollTrigger: {
            trigger: '[data-hero]',
            start: 'top top',
            end: 'bottom top',
            scrub: 0.5,
          },
        });
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className="flex flex-1 flex-col bg-surface">
      <main className="flex-1 overflow-x-hidden">
        <section
          data-hero
          className="relative mx-auto w-full max-w-6xl px-6 pb-16 pt-20 md:pb-24 md:pt-28"
        >
          <div className="flex flex-col items-center text-center">
            <HeroTitle />
            <p className="rise-in mt-6 max-w-2xl text-body-lg text-muted [animation-delay:320ms]">
              Cordel reúne tus organizaciones, equipos y tareas en un mismo lugar, con el espacio y
              la calma que tu equipo necesita para pensar a largo plazo.
            </p>
            <div className="rise-in mt-9 flex flex-col items-center gap-3 sm:flex-row [animation-delay:440ms]">
              <Link
                href="/register"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-action px-7 text-label-lg text-on-primary transition-colors hover:bg-action-hover"
              >
                Crear cuenta
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-panel px-7 text-label-lg text-primary transition-colors hover:bg-hover-surface"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>

          <div className="rise-in [animation-delay:560ms]">
            <div data-preview>
              <ProductPreview />
            </div>
          </div>
        </section>

        <section
          id="producto"
          aria-labelledby="producto-title"
          className="mx-auto w-full max-w-6xl scroll-mt-20 px-6 py-24 md:py-32"
        >
          <div data-reveal>
            <SectionHeading
              id="producto-title"
              title="Todo en su lugar."
              copy="Una estructura pensada para que cada persona encuentre lo que le toca, sin ruido alrededor."
              align="center"
            />
          </div>

          <div className="mt-16 grid gap-12 md:grid-cols-3 md:gap-10">
            {features.map((feature) => (
              <article key={feature.title} data-reveal className="flex flex-col items-start gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-fixed text-on-primary-fixed">
                  {feature.icon}
                </span>
                <h3 className="text-headline-sm text-primary">{feature.title}</h3>
                <p className="text-body-md text-muted">{feature.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="aislamiento"
          aria-labelledby="aislamiento-title"
          className="scroll-mt-20 border-y border-border bg-panel"
        >
          <div className="mx-auto grid w-full max-w-6xl gap-16 px-6 py-24 md:grid-cols-2 md:items-center md:py-32">
            <div data-reveal className="flex flex-col items-start gap-5">
              <span className="text-label-md text-secondary">Aislamiento estricto</span>
              <h2
                id="aislamiento-title"
                className="text-balance text-display-lg text-primary"
              >
                Los datos de un equipo no cruzan la frontera.
              </h2>
              <p className="text-body-lg text-muted">
                Cada equipo vive en su propio espacio. El aislamiento no depende de que alguien
                recuerde filtrar: la estructura de datos impide mezclar información entre equipos.
              </p>
              <ul className="mt-2 flex flex-col gap-3">
                {isolationPoints.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-body-md text-muted">
                    <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-sage" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <div data-reveal>
              <IsolationDiagram />
            </div>
          </div>
        </section>

        <section
          id="roles"
          aria-labelledby="roles-title"
          className="mx-auto w-full max-w-6xl scroll-mt-20 px-6 py-24 md:py-32"
        >
          <div data-reveal>
            <SectionHeading
              id="roles-title"
              title="El rol correcto, en el nivel correcto."
              copy="Tu rol en la organización y tu rol en el equipo conviven. Cuando ambos existen, el del equipo es el que decide."
              align="center"
            />
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-2">
            {roleCards.map((card) => (
              <article
                key={card.level}
                data-reveal
                className="flex flex-col rounded-lg border border-border bg-panel p-8"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-label-sm uppercase tracking-caps text-muted">
                    {card.level}
                  </span>
                  <span className="text-data-sm text-muted">{card.scope}</span>
                </div>
                <h3 className="mt-4 text-headline-sm text-primary">{card.title}</h3>
                <p className="mt-2 flex-1 text-body-md text-muted">{card.copy}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {['OWNER', 'ADMIN', 'MEMBER'].map((role) => (
                    <span
                      key={role}
                      className="rounded-full border border-border bg-surface px-3 py-1.5 text-label-sm text-muted"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <p data-reveal className="mt-8 text-center text-body-sm text-muted">
            El rol del equipo tiene prioridad sobre el rol de la organización.
          </p>
        </section>

        <section
          aria-labelledby="cta-title"
          className="mx-auto w-full max-w-6xl px-6 pb-24 md:pb-32"
        >
          <div
            data-reveal
            className="relative overflow-hidden rounded-xl bg-primary px-6 py-20 text-center md:px-16 md:py-24"
          >
            <h2
              id="cta-title"
              className="mx-auto max-w-2xl text-balance text-display-lg text-on-primary"
            >
              Empieza por una organización. El resto se acomoda.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-body-lg text-primary-fixed">
              Crea tu cuenta y ordena el trabajo con la calma que tu equipo necesita.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex h-12 items-center justify-center rounded-full bg-white px-7 text-label-lg text-primary transition-colors hover:bg-primary-fixed"
              >
                Crear cuenta
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/20 px-7 text-label-lg text-primary-fixed transition-colors hover:border-white/40 hover:text-white"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-headline-sm text-primary">Cordel</span>
            <span className="text-body-sm text-muted">Organiza el trabajo, no el ruido.</span>
          </div>

          <nav aria-label="Pie de página" className="flex flex-wrap gap-x-6 gap-y-2">
            <Link
              href="/#producto"
              className="text-label-md text-muted transition-colors hover:text-primary"
            >
              Producto
            </Link>
            <Link
              href="/#aislamiento"
              className="text-label-md text-muted transition-colors hover:text-primary"
            >
              Aislamiento
            </Link>
            <Link
              href="/#roles"
              className="text-label-md text-muted transition-colors hover:text-primary"
            >
              Roles
            </Link>
            <Link
              href="/login"
              className="text-label-md text-muted transition-colors hover:text-primary"
            >
              Iniciar sesión
            </Link>
          </nav>

          <span className="text-body-sm text-muted">© 2026 Cordel</span>
        </div>
      </footer>
    </div>
  );
}
