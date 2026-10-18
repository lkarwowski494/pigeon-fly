import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import { CollapsibleCard } from '../src/components/CollapsibleCard';

describe('CollapsibleCard (P16 Inline Pattern)', () => {
  it('renders header with title, subtitle, and badge', () => {
    const onToggle = jest.fn();
    let component: renderer.ReactTestRenderer;

    act(() => {
      component = renderer.create(
        <CollapsibleCard
          title="Harmonogram Lęgów"
          subtitle="Cela A-04"
          badge="Aktywny"
          badgeColor="#2563EB"
          isOpen={false}
          onToggle={onToggle}
        >
          <Text>Zawartość ukryta</Text>
        </CollapsibleCard>
      );
    });

    const root = component!.root;
    const texts = root.findAllByType(Text).map((t) => t.props.children);
    expect(texts).toContain('Harmonogram Lęgów');
    expect(texts).toContain('Cela A-04');
    expect(texts).toContain('Aktywny');
    expect(texts).toContain('▼');
  });

  it('renders children only when open', () => {
    const onToggle = jest.fn();
    let component: renderer.ReactTestRenderer;

    act(() => {
      component = renderer.create(
        <CollapsibleCard
          title="Harmonogram Lęgów"
          isOpen={false}
          onToggle={onToggle}
        >
          <Text>Sekcja Szczegółów</Text>
        </CollapsibleCard>
      );
    });

    let texts = component!.root.findAllByType(Text).map((t) => t.props.children);
    expect(texts).not.toContain('Sekcja Szczegółów');

    act(() => {
      component.update(
        <CollapsibleCard
          title="Harmonogram Lęgów"
          isOpen={true}
          onToggle={onToggle}
        >
          <Text>Sekcja Szczegółów</Text>
        </CollapsibleCard>
      );
    });

    texts = component!.root.findAllByType(Text).map((t) => t.props.children);
    expect(texts).toContain('Sekcja Szczegółów');
    expect(texts).toContain('▲');
  });

  it('calls onToggle when header is pressed', async () => {
    const onToggle = jest.fn();
    let component: renderer.ReactTestRenderer;

    act(() => {
      component = renderer.create(
        <CollapsibleCard
          title="Harmonogram Lęgów"
          isOpen={false}
          onToggle={onToggle}
        >
          <Text>Test</Text>
        </CollapsibleCard>
      );
    });

    const button = component!.root.findByType(TouchableOpacity);
    await act(async () => {
      button.props.onPress();
    });

    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
