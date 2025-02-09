import type React from "react"
import { FixedSizeList as List } from "react-window"
import AutoSizer from "react-virtualized-auto-sizer"

interface VirtualizedListProps {
  itemCount: number
  itemSize: number
  renderItem: (index: number) => React.ReactNode
  height: number
  width: string | number
}

export const VirtualizedList: React.FC<VirtualizedListProps> = ({ itemCount, itemSize, renderItem, height, width }) => {
  return (
    <AutoSizer disableHeight>
      {({ width }) => (
        <List height={height} itemCount={itemCount} itemSize={itemSize} width={width}>
          {({ index, style }) => <div style={style}>{renderItem(index)}</div>}
        </List>
      )}
    </AutoSizer>
  )
}

