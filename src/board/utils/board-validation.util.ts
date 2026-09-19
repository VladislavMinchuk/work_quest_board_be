import { BadRequestException } from '@nestjs/common';
import { LocationKey, StandardLocationTasks } from '../types/board.types';

const PERIOD_REGEX = /^(1[0-2]|[1-9])\.[1-4]$/;
const VALID_PARTICIPANTS = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'] as const;

export type ParticipantId = (typeof VALID_PARTICIPANTS)[number];

// Словник допустимих статусів для кожного taskKey у StandardLocationTasks
const TASK_VALUE_SCHEMA: Record<keyof StandardLocationTasks, readonly string[]> = {
  scrapping: ['not_started', 'in_progress', 'done'],
  invoices_breakdown: ['not_started', 'in_progress', 'done'],
  report_card: ['not_started', 'in_progress', 'done'],
  waybills: ['not_started', 'collecting', 'on_desk'],
  write_off_act: ['not_started', 'in_progress', 'signed'],
};

export function parseAndValidatePeriod(periodInput: string): string {
  if (!periodInput || typeof periodInput !== 'string') {
    throw new BadRequestException('Некоректний період: значення має бути рядком');
  }

  // Очищаємо від випадкового participantId ("1.1_p1" -> "1.1")
  const cleanPeriod = periodInput.split('_')[0].trim();

  if (!PERIOD_REGEX.test(cleanPeriod)) {
    throw new BadRequestException(
      `Некоректний період: "${periodInput}". Очікується формат "місяць.тиждень" від "1.1" до "12.4"`,
    );
  }

  return cleanPeriod;
}

/**
 * Валідує учасника та доступність локації (PPD / Field)
 */
export function validateParticipantAndLocation(
  participantId: string,
  location: LocationKey,
): void {
  if (!VALID_PARTICIPANTS.includes(participantId as ParticipantId)) {
    throw new BadRequestException(`Неіснуючий participantId: ${participantId}`);
  }

  // Бізнес-правило: p5 та p6 не мають локації "Поле"
  if ((participantId === 'p5' || participantId === 'p6') && location === 'field') {
    throw new BadRequestException(
      `Учасник ${participantId} не має локації "Поле"`,
    );
  }
}

/**
 * Валідує taskKey та його значення (value) відповідно до схем статусів
 */
export function validateTaskAndValue(taskKey: string, value: string): void {
  const allowedValues = TASK_VALUE_SCHEMA[taskKey as keyof StandardLocationTasks];

  // 1. Перевірка наявності taskKey серед StandardLocationTasks
  if (!allowedValues) {
    const validKeys = Object.keys(TASK_VALUE_SCHEMA).join(', ');
    throw new BadRequestException(
      `Некоректне завдання: "${taskKey}". Дозволені ключі: [${validKeys}]`,
    );
  }

  // 2. Перевірка статусу (value) для даного taskKey
  if (!allowedValues.includes(value)) {
    throw new BadRequestException(
      `Некоректний статус "${value}" для завдання "${taskKey}". Дозволені значення: [${allowedValues.join(', ')}]`,
    );
  }
}