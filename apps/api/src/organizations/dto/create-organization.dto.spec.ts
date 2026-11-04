import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateOrganizationDto } from './create-organization.dto.js';

// comprueba la regla de formato del slug (ADR 003) sin tocar la base de datos
async function validateSlug(slug: unknown): Promise<string[]> {
  const dto = plainToInstance(CreateOrganizationDto, {
    name: 'Acme',
    slug,
  });
  const errors = await validate(dto);
  return errors.flatMap((e) => (e.constraints ? Object.values(e.constraints) : []));
}

describe('CreateOrganizationDto', () => {
  it('acepta slugs con formato correcto', async () => {
    for (const slug of ['acme', 'mi-empresa', 'empresa-2026', 'a1']) {
      expect(await validateSlug(slug)).toEqual([]);
    }
  });

  it('normaliza espacios y mayúsculas antes de validar', async () => {
    expect(await validateSlug('  Acme  ')).toEqual([]);
    expect(await validateSlug('MI-Empresa')).toEqual([]);
  });

  it('rechaza slugs con formato inválido', async () => {
    const casos: Array<[unknown, string]> = [
      ['Mi Org', 'espacios'],
      ['-acme', 'guion al inicio'],
      ['acme-', 'guion al final'],
      ['a--b', 'guiones seguidos'],
      ['empresa!!', 'caracteres especiales'],
      ['', 'vacío'],
      [42, 'no string'],
      [null, 'nulo'],
    ];

    for (const [slug, caso] of casos) {
      expect(await validateSlug(slug), `debería rechazar: ${caso}`).not.toEqual([]);
    }
  });

  it('devuelve el mensaje en español', async () => {
    const mensajes = await validateSlug('Mi Org');
    expect(mensajes).toContain(
      'El slug solo puede contener letras minúsculas, números y guiones intermedios',
    );
  });
});
