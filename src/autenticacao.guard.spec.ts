import { UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { AutenticacaoGuard } from './autenticacao.guard';

describe('AutenticacaoGuard', () => {
  let guard: AutenticacaoGuard;
  let reflector: Reflector;

  const mockClientProxy = {
    send: jest.fn(),
  };

  const mockContext = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        headers: {
          authorization: 'Bearer token',
        },
      }),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutenticacaoGuard,
        {
          provide: 'USUARIO_CLIENT',
          useValue: mockClientProxy,
        },
        Reflector,
      ],
    }).compile();

    guard = module.get<AutenticacaoGuard>(AutenticacaoGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should pass if route is public', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    const result = await guard.canActivate(mockContext as any);

    expect(result).toBe(true);
  });

  it('should pass if authentication is successful', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    jest.spyOn(clientProxy, 'send').mockReturnValue(throwError(() => new UnauthorizedException('Usuário não autenticado!')));

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: 'Bearer invalid_jwt',
          },
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('deve permitir acesso se o JWT for válido', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    jest.spyOn(clientProxy, 'send').mockReturnValue(of(true));

    const result = await guard.canActivate(mockContext as any);

    expect(result).toBe(true);
  });

  it('should not pass if authentication is unsuccessful', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    mockClientProxy.send.mockReturnValue(of(false));

    guard
      .canActivate(mockContext as any)
      .catch((err) =>
        expect(err).toEqual(
          new UnauthorizedException('Usuário não autenticado!'),
        ),
      );
  });
});
