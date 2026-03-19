import { NotificationService } from './notification.service';
import { EmailService } from '../shared/infrastructure/email/EmailService';
import { FirestoreUserRepository } from '../users/infrastructure/persistence/FirestoreUserRepository';

describe('NotificationService', () => {
  let service: NotificationService;
  let mockEmailService: jest.Mocked<EmailService>;
  let mockUserRepository: jest.Mocked<FirestoreUserRepository>;

  beforeEach(() => {
    process.env.APP_URL = 'https://forge.example.com';

    mockEmailService = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
      sendInviteEmail: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockUserRepository = {
      getById: jest.fn(),
    } as any;

    service = new NotificationService(mockEmailService, mockUserRepository);
  });

  afterEach(() => {
    delete process.env.APP_URL;
  });

  describe('notifyTicketAssigned', () => {
    it('sends assignment email with correct subject and body', async () => {
      mockUserRepository.getById.mockResolvedValue({
        getEmail: () => 'dev@example.com',
      } as any);

      await service.notifyTicketAssigned('ticket-1', 'user-1', 'Add login page');

      expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(1);
      const [to, subject, textBody, htmlBody] = mockEmailService.sendEmail.mock.calls[0];
      expect(to).toBe('dev@example.com');
      expect(subject).toContain('[Forge]');
      expect(subject).toContain('Add login page');
      expect(textBody).toContain('Add login page');
      expect(textBody).toContain('https://forge.example.com/tickets/ticket-1');
      expect(htmlBody).toContain('Add login page');
      expect(htmlBody).toContain('View Ticket');
    });
  });

  describe('notifyTicketReady', () => {
    it('sends approval email with correct subject and body', async () => {
      mockUserRepository.getById.mockResolvedValue({
        getEmail: () => 'dev@example.com',
      } as any);

      await service.notifyTicketReady('ticket-2', 'user-1', 'Fix auth bug');

      expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(1);
      const [to, subject, textBody, htmlBody] = mockEmailService.sendEmail.mock.calls[0];
      expect(to).toBe('dev@example.com');
      expect(subject).toContain('[Forge]');
      expect(subject).toContain('Fix auth bug');
      expect(textBody).toContain('forge execute');
      expect(textBody).toContain('https://forge.example.com/tickets/ticket-2');
      expect(htmlBody).toContain('forge execute');
      expect(htmlBody).toContain('View Ticket');
    });
  });

  describe('User not found', () => {
    it('skips silently when user is not found', async () => {
      mockUserRepository.getById.mockResolvedValue(null);

      await service.notifyTicketAssigned('ticket-1', 'unknown-user', 'Test');

      expect(mockEmailService.sendEmail).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('does not propagate sendEmail errors', async () => {
      mockUserRepository.getById.mockResolvedValue({
        getEmail: () => 'dev@example.com',
      } as any);
      mockEmailService.sendEmail.mockRejectedValue(new Error('SendGrid down'));

      await expect(
        service.notifyTicketAssigned('ticket-1', 'user-1', 'Test'),
      ).resolves.not.toThrow();
    });
  });
});
