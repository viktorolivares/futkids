import { HttpException, HttpStatus } from '@nestjs/common';

export interface PlanLimitErrorPayload {
  statusCode: number;
  code: string;
  message: string;
  feature: string;
  current: number;
  limit: number;
  upgradeRequired: boolean;
}

export class PlanLimitException extends HttpException {
  constructor(options: {
    feature: string;
    current: number;
    limit: number;
    customMessage?: string;
  }) {
    const message =
      options.customMessage ||
      `Has alcanzado el límite de tu plan (${options.limit} ${options.feature.toLowerCase().replace('max_', '')}). Actualiza al plan Pro para continuar sin límites.`;

    const payload: PlanLimitErrorPayload = {
      statusCode: HttpStatus.FORBIDDEN,
      code: 'PLAN_LIMIT_REACHED',
      message,
      feature: options.feature,
      current: options.current,
      limit: options.limit,
      upgradeRequired: true,
    };

    super(payload, HttpStatus.FORBIDDEN);
  }
}
