import { BaseNode } from '@voiceflow/base-types';
import axios from 'axios';
import { expect } from 'chai';
import FormData from 'form-data';
import querystring from 'querystring';
import sinon from 'sinon';

import * as APIUtils from '@/runtime/lib/Handlers/api/utils';

import { baseData, baseOptions } from './fixture';

describe('Handlers api utils unit tests', () => {
  describe('getVariableAtJSONPath', () => {
    it('retrieves value at json path', () => {
      const data = {
        a: {
          b: 422,
        },
      };
      expect(APIUtils.getVariableAtJSONPath(data, 'a.b')).to.equal(422);
    });

    it('retrieves value at json path with array accessor', () => {
      const data = {
        a: {
          b: [
            {
              c: '00001234',
            },
          ],
        },
      };
      expect(APIUtils.getVariableAtJSONPath(data, 'a.b[0].c')).to.equal('00001234');
    });

    it('retrieves value at json path with random array', () => {
      const data = {
        a: {
          b: ['hello'],
        },
      };
      expect(APIUtils.getVariableAtJSONPath(data, 'a.b[{random}]')).to.equal('hello');
    });
  });

  describe('makeAPICall', () => {
    let validateIPStub: sinon.SinonStub;
    let axiosAdaptorStub: sinon.SinonStub;
    beforeEach(() => {
      validateIPStub = sinon.stub(APIUtils, 'validateIP');
      axiosAdaptorStub = sinon.stub();
      axios.defaults.adapter = axiosAdaptorStub;
    });

    afterEach(() => {
      validateIPStub.restore();
      axios.defaults.adapter = undefined;
    });

    it('works', async () => {
      validateIPStub.returns(null);
      axiosAdaptorStub.resolves({
        data: {
          a: {
            b: [
              {
                c: '00001234',
              },
            ],
            d: 422,
          },
        },
      });

      const runtime = {
        outgoingApiLimiter: {
          addHostnameUseAndShouldThrottle: sinon.stub().resolves(false),
        },
      } as any;

      const nodeData = {
        url: 'http://0.0.0.0',
        mapping: [
          {
            var: 'var1',
            path: 'response.a.b[0].c',
          },
          {
            var: 'var2',
            path: 'response.a.d',
          },
        ],
      } as any;

      const { variables } = await APIUtils.makeAPICall(nodeData, runtime);

      expect(variables.var1).to.equal('00001234');
      expect(variables.var2).to.equal(422);
    });
  });

  describe('ReduceKeyValue', () => {
    it('works', () => {
      const arr = [
        { key: 'key1', val: 'value1' },
        { key: 'key2', val: 'value2' },
        { key: 'key3', val: 'value3' },
        { key: 'key1', val: 'value4' },
        { key: '', val: 'value5' },
      ];

      expect(APIUtils.ReduceKeyValue(arr)).to.eql({
        key1: 'value4',
        key2: 'value2',
        key3: 'value3',
      });
    });
  });

  describe('formatRequestConfig', () => {
    afterEach(() => {
      sinon.restore();
    });
    describe('get method', () => {
      it('raw input body type', async () => {
        const data = {
          ...baseData,
          method: BaseNode.Api.APIMethod.GET,
          bodyInputType: BaseNode.Api.APIBodyType.RAW_INPUT,
        };

        const { validateStatus, ...rest } = APIUtils.formatRequestConfig(data as any);
        expect(rest).to.eql({
          ...baseOptions,
          method: data.method,
          headers: { header1: baseOptions.headers.header1 },
        });
      });

      it('form data body type', async () => {
        const data = {
          ...baseData,
          method: BaseNode.Api.APIMethod.GET,
          bodyInputType: BaseNode.Api.APIBodyType.FORM_DATA,
        };

        const { validateStatus, ...rest } = APIUtils.formatRequestConfig(data as any);
        expect(rest).to.eql({
          ...baseOptions,
          method: data.method,
          headers: { header1: baseOptions.headers.header1 },
        });
      });
    });

    describe('raw input body', () => {
      it('converts to json', async () => {
        const parseStub = sinon.stub(JSON, 'parse').returns('parsedJSON');
        const data = {
          ...baseData,
          bodyInputType: BaseNode.Api.APIBodyType.RAW_INPUT,
        };

        const { validateStatus, ...rest } = APIUtils.formatRequestConfig(data as any);
        expect(rest).to.eql({
          ...baseOptions,
          data: 'parsedJSON',
        });
        expect(parseStub.args).to.eql([[data.content]]);
      });

      it('catches error', async () => {
        const parseStub = sinon.stub(JSON, 'parse').throws('abc');
        const data = {
          ...baseData,
          bodyInputType: BaseNode.Api.APIBodyType.RAW_INPUT,
        };

        const { validateStatus, ...rest } = APIUtils.formatRequestConfig(data as any);
        expect(rest).to.eql({
          ...baseOptions,
          data,
        });
        expect(parseStub.args).to.eql([[data.content]]);
      });
    });

    describe('formdata body', () => {
      it('works', async () => {
        const formDataAppendSpy = sinon.spy(FormData.prototype, 'append');
        const formDataGetHeadersSpy = sinon.stub(FormData.prototype, 'getHeaders').returns({ someHeader: 'getHeadersReturn' as any });
        const data = {
          ...baseData,
          body: [
            { key: 'a', val: 'b' },
            { key: 'c', val: 'd' },
          ],
          bodyInputType: BaseNode.Api.APIBodyType.FORM_DATA,
        };

        const { validateStatus, data: formDataObj, ...rest } = APIUtils.formatRequestConfig(data as any);
        expect(rest).to.eql({
          ...baseOptions,
          headers: {
            ...baseOptions.headers,
            someHeader: 'getHeadersReturn',
          },
        });
        expect(formDataObj).to.be.instanceOf(FormData);
        expect(formDataAppendSpy.args).to.eql([
          ['a', 'b'],
          ['c', 'd'],
        ]);
      });
    });

    describe('string body', () => {
      it('works', async () => {
        const data = {
          ...baseData,
          bodyInputType: 'abdef',
          body: 'body-value',
        };

        const { validateStatus, ...rest } = APIUtils.formatRequestConfig(data as any);
        expect(rest).to.eql({
          ...baseOptions,
          data: 'body-value',
        });
      });
    });

    describe('urlencoded body', () => {
      it('works for array body', async () => {
        const formDataGetHeadersSpy = sinon.stub(querystring, 'stringify').returns('querystring stringify');
        const data = {
          ...baseData,
          bodyInputType: BaseNode.Api.APIBodyType.URL_ENCODED,
          body: [
            { key: 'body1', val: 'never' },
            { key: 'body1', val: 'bodyval' },
          ],
        };

        const { validateStatus, ...rest } = APIUtils.formatRequestConfig(data as any);
        expect(rest).to.eql({
          ...baseOptions,
          data: 'querystring stringify',
          headers: {
            ...baseOptions.headers,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });
        expect(formDataGetHeadersSpy.args).to.eql([[{ body1: 'bodyval' }]]);
      });

      it('works for non array body', async () => {
        const formDataGetHeadersSpy = sinon.stub(querystring, 'stringify').returns('querystring stringify');
        const data = {
          ...baseData,
          bodyInputType: BaseNode.Api.APIBodyType.URL_ENCODED,
          body: 'body-value',
        };

        const { validateStatus, ...rest } = APIUtils.formatRequestConfig(data as any);
        expect(rest).to.eql({
          ...baseOptions,
          data: 'querystring stringify',
          headers: {
            ...baseOptions.headers,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });
        expect(formDataGetHeadersSpy.args).to.eql([['body-value']]);
      });
    });

    describe('keyvalue body', () => {
      it('works', async () => {
        const data = {
          ...baseData,
          bodyInputType: 'keyValue',
          body: [
            { key: 'body1', val: 'never' },
            { key: 'body1', val: 'bodyval' },
          ],
        };

        const { validateStatus, ...rest } = APIUtils.formatRequestConfig(data as any);
        expect(rest).to.eql({
          ...baseOptions,
          data: { body1: 'bodyval' },
        });
      });
    });

    it('does key value if other body and body is array', async () => {
      const data = {
        ...baseData,
        bodyInputType: 'some-body',
        body: [
          { key: 'body1', val: 'never' },
          { key: 'body1', val: 'bodyval' },
        ],
      };

      const { validateStatus, ...rest } = APIUtils.formatRequestConfig(data as any);
      expect(rest).to.eql({
        ...baseOptions,
        data: { body1: 'bodyval' },
      });
    });

    it('returns basic options if bodytype is not raw,formdata,urlenc,keyValue and body is not array', async () => {
      const data = {
        ...baseData,
        bodyInputType: 'abcdef',
        body: {},
      };

      const { validateStatus, ...rest } = APIUtils.formatRequestConfig(data as any);
      expect(rest).to.eql({
        ...baseOptions,
      });
    });
  });
});
