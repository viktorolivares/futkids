import { HttpException, HttpStatus } from '@nestjs/common';

export interface FeatureNotAvailableErrorPayload {
  statusCode: number;
  code: string;
  message: string;
  feature: string;
  upgradeRequired: boolean;
}

export class FeatureNotAvailableException extends HttpException {
  constructor(feature: string, customMessage?: string) {
    const message =
      customMessage ||
      `La funcionalidad '${feature}' no está disponible en tu plan actual. Actualiza a Pro para acceder a ella.`;

    const payload: FeatureNotAvailableErrorPayload = {
      statusCode: HttpStatus.FORBIDDEN,
      code: 'FEATURE_NOT_AVAILABLE',
      message,
      feature,
      upgradeRequired: true,
    };

    super(payload, HttpStatus.FORBIDDEN);
  }
}
