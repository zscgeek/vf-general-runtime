import { expect } from 'chai';
import sinon from 'sinon';

import { ivmExecute, vmExecute } from '@/runtime/lib/Handlers/code/utils';

describe('codeHandler utils unit tests', () => {
  describe('vmExecute', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('works correctly', () => {
      const data = {
        code: `
        const _ = requireFromUrl('https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.20/lodash.min.js');
        res = _.add(15, 18);
        res2 = _.max([4, 12, 0, -3, 9]);
        `,
        variables: { res: 0, res2: 0 },
      };
      expect(vmExecute(data, true)).to.eql({ res: 33, res2: 12 });
    });
  });
  describe('ivmExecute', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('works correctly', async () => {
      const data = {
        code: `
        res = 15 + 18;
        res2 = true ? 12 : 11;
        `,
        variables: { res: 0, res2: 0 },
      };
      expect(await ivmExecute(data)).to.eql({ res: 33, res2: 12 });
    });
  });
});
