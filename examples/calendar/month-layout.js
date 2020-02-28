registerLayout("blocklike", class {
    static get childInputProperties() { return ['margin-left', 'margin-right', 'margin-top', 'margin-bottom'];}
    // currently: all children are blockified
    async intrinsicSizes() {}
    async layout(children, edges, constraintSpace, styles) {
      const childFragments = [];
      let inlineOffset = 0;
      let blockOffset = 0;
      let maxBlockSizeInRow = 0;
      let availableInlineSize = constraintSpace.fixedInlineSize;
      let isRepeatAttempt = false;

      for(let i = 0; i < children.length; i++) {
        let child = children[i];
        let childFragment = await child.layoutNextFragment({
          availableInlineSize
        });
        const leftMargin = child.styleMap.get('margin-left').value;
        const rightMargin = child.styleMap.get('margin-right').value;
        const topMargin = child.styleMap.get('margin-top').value;
        const bottomMargin = child.styleMap.get('margin-bottom').value;
        let childInlineSize = childFragment.inlineSize + leftMargin + rightMargin;
        // If there’s not enough room left on this row, start a new row and
        // layout the current child again.
        if(childInlineSize > availableInlineSize && !isRepeatAttempt) {
          availableInlineSize = constraintSpace.fixedInlineSize;
          blockOffset += maxBlockSizeInRow;
          maxBlockSizeInRow = 0;
          inlineOffset = 0;
          isRepeatAttempt = true;
          // Restart loop
          i--;
          continue;
        } else if(childInlineSize > availableInlineSize && isRepeatAttempt) {
          // If the second attempt failed as well, the child is wider than the
          // there’s room. In that case, force it to be laid out at max width.
          childFragment = await child.layoutNextFragment({
            fixedInlineSize: availableInlineSize - leftMargin - rightMargin
          });
        }
        isRepeatAttempt = false;
        childFragment.inlineOffset = inlineOffset + leftMargin;
        childFragment.blockOffset = blockOffset + topMargin;
        childFragments.push(childFragment);

        inlineOffset += childInlineSize;
        maxBlockSizeInRow = Math.max(maxBlockSizeInRow, childFragment.blockSize + topMargin + bottomMargin);
        availableInlineSize -= childInlineSize;
      }

      return {
        childFragments,
        autoBlockSize: blockOffset + maxBlockSizeInRow
      };
    }
  });