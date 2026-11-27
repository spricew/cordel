import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AcceptInvitationDto } from './accept-invitation.dto.js';

async function validateDto(payload: Record<string, unknown>): Promise<{
  dto: AcceptInvitationDto;
  messages: string[];
}> {
  const dto = plainToInstance(AcceptInvitationDto, payload);
  const errors = await validate(dto);
  const messages = errors.flatMap((e) => (e.constraints ? Object.values(e.constraints) : []));
  return { dto, messages };
}

describe('AcceptInvitationDto', () => {
  it('acepta un token válido y recorta espacios alrededor', async () => {
    const { dto, messages } = await validateDto({ token: '  abcDEF_123-xyz  ' });

    expect(messages).toEqual([]);
    expect(dto.token).toBe('abcDEF_123-xyz');
  });

  it('rechaza tokens vacíos o solo espacios', async () => {
    for (const token of ['', '   ', '\t\n']) {
      const { messages } = await validateDto({ token });
      expect(messages).toContain('El token es obligatorio');
    }
  });

  it('rechaza valores que no son string', async () => {
    for (const token of [123, null, undefined, { raw: 'token' }]) {
      const { messages } = await validateDto({ token });
      expect(messages).toContain('El token debe ser texto');
    }
  });

  it('rechaza tokens excesivamente largos para evitar abuso', async () => {
    const { messages } = await validateDto({ token: 'a'.repeat(257) });
    expect(messages).toContain('El token no es válido');
  });
});
