// Types
import { RegexReplace, DomainSnippets } from './types';

export const enum SOURCE_DOMAIN {
  GOOD_READS = 'goodreads.com',
  FAHASA = 'fahasa.com',
  TIKI = 'tiki.vn',
}

export const GLOBAL_REGEX_CONTENT: RegexReplace[] = [
  {
    searchValue: /(?:\\[n])+/g,
    replaceValue: '\\n\\n',
  },
  // Tiki
  {
    searchValue: 'Giá sản phẩm trên Tiki đã bao gồm thuế theo luật hiện hành. Tuy nhiên tuỳ vào từng loại sản phẩm hoặc phương thức, địa chỉ giao hàng mà có thể phát sinh thêm chi phí khác như phí vận chuyển, phụ phí hàng cồng kềnh, ...',
    replaceValue: '',
  },
];

const HTMLContentTag = ['b', 'i', 'u', 'strong'];

const parsingHTMLContentFormat = (x: any) => {
  let contentX = '';

  if (x[0]) {
    x[0].children.map((it, idx) => {
      // Content pure
      if (it.type === 'text') {
        contentX += it.data + '\n\n';
      }
      // Styling content with basic tags
      if (it.type === 'tag' && HTMLContentTag.indexOf(it.name)) {
        if (it.children[0] && it.children[0].type === 'text') {
          contentX += it.children[0].data + '\n\n';
        }
      }
    });
  }

  return contentX;
};

const GoodReadsSnip: DomainSnippets = {
  domain: SOURCE_DOMAIN.GOOD_READS,
  bookSnip: {
    title: 'h1',
    authorName: '#bookAuthors .authorName',
    img: {
      selector: '#coverImage',
      attr: 'src',
    },
    numberOfPages: {
      selector: '#details span[itemprop="numberOfPages"]',
      convert: x => parseInt(x.match(/\d+/) as unknown as string, 10),
    },
    isbn: `#bookDataBox .infoBoxRowItem[itemprop="isbn"]`,
    language: `#bookDataBox .infoBoxRowItem[itemprop="inLanguage"]`,
    description: {
      selector: '#description span',
      eq: 0,
      how: x => parsingHTMLContentFormat(x),
    },
    descriptionFull: {
      selector: '#description span',
      eq: 1,
      how: x => parsingHTMLContentFormat(x),
    },
  },
  authorSnip: {
    name: 'h1',
    img: {
      selector: '.leftContainer img',
      eq: 0,
      attr: 'src',
    },
    dob: {
      selector: '.rightContainer .dataItem',
      eq: 0,
    },
    website: {
      selector: '.rightContainer .dataItem',
      eq: 1,
    },
    description: {
      selector: '.rightContainer .aboutAuthorInfo span',
      eq: 0,
      how: x => parsingHTMLContentFormat(x),
    },
    descriptionFull: {
      selector: '.rightContainer .aboutAuthorInfo span',
      eq: 1,
      how: x => parsingHTMLContentFormat(x),
    },
  },
};

const FahasaSnip: DomainSnippets = {
  domain: SOURCE_DOMAIN.FAHASA,
  bookSnip: {},
  authorSnip: {},
};

const TikiSnip: DomainSnippets = {
  domain: SOURCE_DOMAIN.TIKI,
  bookSnip: {
    title: {
      selector: 'h1',
      convert: x => x.split('(')[0],
    },
    authorName: '.brand-and-author a',
    img: {
      selector: '.thumbnail img',
      attr: 'src',
    },
    numberOfPages: {
      selector: '.content.has-table tbody tr',
      eq: 4,
      convert: x => parseInt(x.match(/\d+/) as unknown as string, 10),
    },
    language: {
      selector: 'language', // Fake selector Fixed language
      convert: x => 'Vietnamese',
    },
    description: {
      selector: '.left .group .content',
      eq: 1,
    },
  },
  authorSnip: {},
};

export const domainSnippets: DomainSnippets[] = [
  GoodReadsSnip,
  TikiSnip,
  FahasaSnip,
];
