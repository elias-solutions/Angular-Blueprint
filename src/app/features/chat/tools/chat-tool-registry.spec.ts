import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthSession } from '../../../core/auth/auth-session';
import { translocoTesting } from '../../../i18n/testing/transloco-testing';
import { PersonApiResolver } from '../../persons/data/person-api-resolver';
import { CHAT_TOOLS, ChatTool, ToolPermission } from './chat-tool';
import { ChatToolRegistry } from './chat-tool-registry';
import { ToolArgumentError, ToolArguments } from './tool-arguments';

class FakeTool implements ChatTool {
  readonly definition;
  execute = jest.fn(async (args: ToolArguments): Promise<unknown> => ({
    echo: args.optionalString('x'),
  }));

  constructor(
    name: string,
    readonly permission: ToolPermission,
  ) {
    this.definition = { name, description: name, parameters: { type: 'object' as const } };
  }
}

describe('ChatToolRegistry', () => {
  let canWrite: ReturnType<typeof signal<boolean>>;
  let canDelete: ReturnType<typeof signal<boolean>>;
  let backendWritable: ReturnType<typeof signal<boolean>>;
  let read: FakeTool;
  let write: FakeTool;
  let remove: FakeTool;
  let registry: ChatToolRegistry;

  beforeEach(() => {
    canWrite = signal(false);
    canDelete = signal(false);
    backendWritable = signal(true);
    read = new FakeTool('read_tool', 'read');
    write = new FakeTool('write_tool', 'write');
    remove = new FakeTool('delete_tool', 'delete');
    TestBed.configureTestingModule({
      imports: [translocoTesting()],
      providers: [
        { provide: CHAT_TOOLS, useValue: [read, write, remove] },
        { provide: AuthSession, useValue: { canWrite, canDelete } },
        {
          provide: PersonApiResolver,
          useValue: { api: () => ({ capabilities: { write: backendWritable() } }) },
        },
      ],
    });
    registry = TestBed.inject(ChatToolRegistry);
  });

  const names = () => registry.definitions().map((definition) => definition.name);

  it('offers readers only read tools', () => {
    expect(names()).toEqual(['read_tool']);
  });

  it('offers writers read and write tools', () => {
    canWrite.set(true);

    expect(names()).toEqual(['read_tool', 'write_tool']);
  });

  it('offers admins every tool', () => {
    canWrite.set(true);
    canDelete.set(true);

    expect(names()).toEqual(['read_tool', 'write_tool', 'delete_tool']);
  });

  it('offers only read tools on a read-only backend, whatever the role', () => {
    canWrite.set(true);
    canDelete.set(true);
    backendWritable.set(false);

    expect(names()).toEqual(['read_tool']);
  });

  it('executes a permitted tool and returns its result as JSON', async () => {
    const outcome = await registry.execute({ id: 'c1', name: 'read_tool', arguments: '{"x":"y"}' });

    expect(outcome).toEqual({ succeeded: true, content: '{"echo":"y"}' });
  });

  it('refuses a tool the user may not use without running it', async () => {
    const outcome = await registry.execute({ id: 'c1', name: 'delete_tool', arguments: '{}' });

    expect(remove.execute).not.toHaveBeenCalled();
    expect(outcome).toEqual({
      succeeded: false,
      content: JSON.stringify({
        error: "Tool 'delete_tool' is not available to the current user.",
      }),
    });
  });

  it('refuses unknown tools', async () => {
    const outcome = await registry.execute({ id: 'c1', name: 'nope', arguments: '{}' });

    expect(outcome.succeeded).toBe(false);
    expect(outcome.content).toContain("Tool 'nope' is not available");
  });

  it('reports invalid arguments back to the model', async () => {
    read.execute.mockRejectedValue(new ToolArgumentError("Argument 'id' is required."));

    const outcome = await registry.execute({ id: 'c1', name: 'read_tool', arguments: '{}' });

    expect(outcome).toEqual({
      succeeded: false,
      content: JSON.stringify({ error: "Argument 'id' is required." }),
    });
  });

  it('reports backend errors as readable messages', async () => {
    read.execute.mockRejectedValue(new HttpErrorResponse({ status: 403 }));

    const outcome = await registry.execute({ id: 'c1', name: 'read_tool', arguments: '{}' });

    expect(outcome.content).toBe(
      JSON.stringify({ error: 'Keine Berechtigung für diese Aktion.', status: 403 }),
    );
  });
});
