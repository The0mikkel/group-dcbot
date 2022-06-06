/**
 * ascii-folder.js
 * https://github.com/mplatt/fold-to-ascii-js
 *
 * This is a JavaScript port of the Apache Lucene ASCII Folding Filter.
 *
 * The Apache Lucene ASCII Folding Filter is licensed to the Apache Software
 * Foundation (ASF) under one or more contributor license agreements. See the
 * NOTICE file distributed with this work for additional information regarding
 * copyright ownership. The ASF licenses this file to You under the Apache
 * License, Version 2.0 (the "License"); you may not use this file except in
 * compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
export default class ASCIIFolder {
    static mapping: any;

    static foldReplacing(str = '', replacement = '') {
        return this._fold(str, () => replacement);
    }

    static foldMaintaining(str = '') {
        return this._fold(str, (char: any) => char);
    }

    static _fold(str: any, fallback: any) {
        if (str === null)
            return '';

        if (typeof str === 'number')
            return '' + str;

        if (typeof str !== 'string')
            throw new Error('Invalid input data type');

        return str.split('').map(character => {
            if (character.charCodeAt(0) < 128) {
                return character;
            } else {
                const replacement = this.mapping.get(character.charCodeAt(0));
                return (replacement === undefined) ? fallback(character) : replacement;
            }
        }).join('');
    }

    mapping = new Map([
        [0xC0, 'A'],
        [0xC1, 'A'],
        [0xC2, 'A'],
        [0xC3, 'A'],
        [0xC4, 'A'],
        [0xC5, 'A'],
        [0x100, 'A'],
        [0x102, 'A'],
        [0x104, 'A'],
        [0x18F, 'A'],
        [0x1CD, 'A'],
        [0x1DE, 'A'],
        [0x1E0, 'A'],
        [0x1FA, 'A'],
        [0x200, 'A'],
        [0x202, 'A'],
        [0x226, 'A'],
        [0x23A, 'A'],
        [0x1D00, 'A'],
        [0x1E00, 'A'],
        [0x1EA0, 'A'],
        [0x1EA2, 'A'],
        [0x1EA4, 'A'],
        [0x1EA6, 'A'],
        [0x1EA8, 'A'],
        [0x1EAA, 'A'],
        [0x1EAC, 'A'],
        [0x1EAE, 'A'],
        [0x1EB0, 'A'],
        [0x1EB2, 'A'],
        [0x1EB4, 'A'],
        [0x1EB6, 'A'],
        [0x24B6, 'A'],
        [0xFF21, 'A'],
        [0xE0, 'a'],
        [0xE1, 'a'],
        [0xE2, 'a'],
        [0xE3, 'a'],
        [0xE4, 'a'],
        [0xE5, 'a'],
        [0x101, 'a'],
        [0x103, 'a'],
        [0x105, 'a'],
        [0x1CE, 'a'],
        [0x1DF, 'a'],
        [0x1E1, 'a'],
        [0x1FB, 'a'],
        [0x201, 'a'],
        [0x203, 'a'],
        [0x227, 'a'],
        [0x250, 'a'],
        [0x259, 'a'],
        [0x25A, 'a'],
        [0x1D8F, 'a'],
        [0x1D95, 'a'],
        [0x1E01, 'a'],
        [0x1E9A, 'a'],
        [0x1EA1, 'a'],
        [0x1EA3, 'a'],
        [0x1EA5, 'a'],
        [0x1EA7, 'a'],
        [0x1EA9, 'a'],
        [0x1EAB, 'a'],
        [0x1EAD, 'a'],
        [0x1EAF, 'a'],
        [0x1EB1, 'a'],
        [0x1EB3, 'a'],
        [0x1EB5, 'a'],
        [0x1EB7, 'a'],
        [0x2090, 'a'],
        [0x2094, 'a'],
        [0x24D0, 'a'],
        [0x2C65, 'a'],
        [0x2C6F, 'a'],
        [0xFF41, 'a'],
        [0xA732, 'AA'],
        [0xC6, 'AE'],
        [0x1E2, 'AE'],
        [0x1FC, 'AE'],
        [0x1D01, 'AE'],
        [0xA734, 'AO'],
        [0xA736, 'AU'],
        [0xA738, 'AV'],
        [0xA73A, 'AV'],
        [0xA73C, 'AY'],
        [0x249C, '(a)'],
        [0xA733, 'aa'],
        [0xE6, 'ae'],
        [0x1E3, 'ae'],
        [0x1FD, 'ae'],
        [0x1D02, 'ae'],
        [0xA735, 'ao'],
        [0xA737, 'au'],
        [0xA739, 'av'],
        [0xA73B, 'av'],
        [0xA73D, 'ay'],
        [0x181, 'B'],
        [0x182, 'B'],
        [0x243, 'B'],
        [0x299, 'B'],
        [0x1D03, 'B'],
        [0x1E02, 'B'],
        [0x1E04, 'B'],
        [0x1E06, 'B'],
        [0x24B7, 'B'],
        [0xFF22, 'B'],
        [0x180, 'b'],
        [0x183, 'b'],
        [0x253, 'b'],
        [0x1D6C, 'b'],
        [0x1D80, 'b'],
        [0x1E03, 'b'],
        [0x1E05, 'b'],
        [0x1E07, 'b'],
        [0x24D1, 'b'],
        [0xFF42, 'b'],
        [0x249D, '(b)'],
        [0xC7, 'C'],
        [0x106, 'C'],
        [0x108, 'C'],
        [0x10A, 'C'],
        [0x10C, 'C'],
        [0x187, 'C'],
        [0x23B, 'C'],
        [0x297, 'C'],
        [0x1D04, 'C'],
        [0x1E08, 'C'],
        [0x24B8, 'C'],
        [0xFF23, 'C'],
        [0xE7, 'c'],
        [0x107, 'c'],
        [0x109, 'c'],
        [0x10B, 'c'],
        [0x10D, 'c'],
        [0x188, 'c'],
        [0x23C, 'c'],
        [0x255, 'c'],
        [0x1E09, 'c'],
        [0x2184, 'c'],
        [0x24D2, 'c'],
        [0xA73E, 'c'],
        [0xA73F, 'c'],
        [0xFF43, 'c'],
        [0x249E, '(c)'],
        [0xD0, 'D'],
        [0x10E, 'D'],
        [0x110, 'D'],
        [0x189, 'D'],
        [0x18A, 'D'],
        [0x18B, 'D'],
        [0x1D05, 'D'],
        [0x1D06, 'D'],
        [0x1E0A, 'D'],
        [0x1E0C, 'D'],
        [0x1E0E, 'D'],
        [0x1E10, 'D'],
        [0x1E12, 'D'],
        [0x24B9, 'D'],
        [0xA779, 'D'],
        [0xFF24, 'D'],
        [0xF0, 'd'],
        [0x10F, 'd'],
        [0x111, 'd'],
        [0x18C, 'd'],
        [0x221, 'd'],
        [0x256, 'd'],
        [0x257, 'd'],
        [0x1D6D, 'd'],
        [0x1D81, 'd'],
        [0x1D91, 'd'],
        [0x1E0B, 'd'],
        [0x1E0D, 'd'],
        [0x1E0F, 'd'],
        [0x1E11, 'd'],
        [0x1E13, 'd'],
        [0x24D3, 'd'],
        [0xA77A, 'd'],
        [0xFF44, 'd'],
        [0x1C4, 'DZ'],
        [0x1F1, 'DZ'],
        [0x1C5, 'Dz'],
        [0x1F2, 'Dz'],
        [0x249F, '(d)'],
        [0x238, 'db'],
        [0x1C6, 'dz'],
        [0x1F3, 'dz'],
        [0x2A3, 'dz'],
        [0x2A5, 'dz'],
        [0xC8, 'E'],
        [0xC9, 'E'],
        [0xCA, 'E'],
        [0xCB, 'E'],
        [0x112, 'E'],
        [0x114, 'E'],
        [0x116, 'E'],
        [0x118, 'E'],
        [0x11A, 'E'],
        [0x18E, 'E'],
        [0x190, 'E'],
        [0x204, 'E'],
        [0x206, 'E'],
        [0x228, 'E'],
        [0x246, 'E'],
        [0x1D07, 'E'],
        [0x1E14, 'E'],
        [0x1E16, 'E'],
        [0x1E18, 'E'],
        [0x1E1A, 'E'],
        [0x1E1C, 'E'],
        [0x1EB8, 'E'],
        [0x1EBA, 'E'],
        [0x1EBC, 'E'],
        [0x1EBE, 'E'],
        [0x1EC0, 'E'],
        [0x1EC2, 'E'],
        [0x1EC4, 'E'],
        [0x1EC6, 'E'],
        [0x24BA, 'E'],
        [0x2C7B, 'E'],
        [0xFF25, 'E'],
        [0xE8, 'e'],
        [0xE9, 'e'],
        [0xEA, 'e'],
        [0xEB, 'e'],
        [0x113, 'e'],
        [0x115, 'e'],
        [0x117, 'e'],
        [0x119, 'e'],
        [0x11B, 'e'],
        [0x1DD, 'e'],
        [0x205, 'e'],
        [0x207, 'e'],
        [0x229, 'e'],
        [0x247, 'e'],
        [0x258, 'e'],
        [0x25B, 'e'],
        [0x25C, 'e'],
        [0x25D, 'e'],
        [0x25E, 'e'],
        [0x29A, 'e'],
        [0x1D08, 'e'],
        [0x1D92, 'e'],
        [0x1D93, 'e'],
        [0x1D94, 'e'],
        [0x1E15, 'e'],
        [0x1E17, 'e'],
        [0x1E19, 'e'],
        [0x1E1B, 'e'],
        [0x1E1D, 'e'],
        [0x1EB9, 'e'],
        [0x1EBB, 'e'],
        [0x1EBD, 'e'],
        [0x1EBF, 'e'],
        [0x1EC1, 'e'],
        [0x1EC3, 'e'],
        [0x1EC5, 'e'],
        [0x1EC7, 'e'],
        [0x2091, 'e'],
        [0x24D4, 'e'],
        [0x2C78, 'e'],
        [0xFF45, 'e'],
        [0x24A0, '(e)'],
        [0x191, 'F'],
        [0x1E1E, 'F'],
        [0x24BB, 'F'],
        [0xA730, 'F'],
        [0xA77B, 'F'],
        [0xA7FB, 'F'],
        [0xFF26, 'F'],
        [0x192, 'f'],
        [0x1D6E, 'f'],
        [0x1D82, 'f'],
        [0x1E1F, 'f'],
        [0x1E9B, 'f'],
        [0x24D5, 'f'],
        [0xA77C, 'f'],
        [0xFF46, 'f'],
        [0x24A1, '(f)'],
        [0xFB00, 'ff'],
        [0xFB03, 'ffi'],
        [0xFB04, 'ffl'],
        [0xFB01, 'fi'],
        [0xFB02, 'fl'],
        [0x11C, 'G'],
        [0x11E, 'G'],
        [0x120, 'G'],
        [0x122, 'G'],
        [0x193, 'G'],
        [0x1E4, 'G'],
        [0x1E5, 'G'],
        [0x1E6, 'G'],
        [0x1E7, 'G'],
        [0x1F4, 'G'],
        [0x262, 'G'],
        [0x29B, 'G'],
        [0x1E20, 'G'],
        [0x24BC, 'G'],
        [0xA77D, 'G'],
        [0xA77E, 'G'],
        [0xFF27, 'G'],
        [0x11D, 'g'],
        [0x11F, 'g'],
        [0x121, 'g'],
        [0x123, 'g'],
        [0x1F5, 'g'],
        [0x260, 'g'],
        [0x261, 'g'],
        [0x1D77, 'g'],
        [0x1D79, 'g'],
        [0x1D83, 'g'],
        [0x1E21, 'g'],
        [0x24D6, 'g'],
        [0xA77F, 'g'],
        [0xFF47, 'g'],
        [0x24A2, '(g)'],
        [0x124, 'H'],
        [0x126, 'H'],
        [0x21E, 'H'],
        [0x29C, 'H'],
        [0x1E22, 'H'],
        [0x1E24, 'H'],
        [0x1E26, 'H'],
        [0x1E28, 'H'],
        [0x1E2A, 'H'],
        [0x24BD, 'H'],
        [0x2C67, 'H'],
        [0x2C75, 'H'],
        [0xFF28, 'H'],
        [0x125, 'h'],
        [0x127, 'h'],
        [0x21F, 'h'],
        [0x265, 'h'],
        [0x266, 'h'],
        [0x2AE, 'h'],
        [0x2AF, 'h'],
        [0x1E23, 'h'],
        [0x1E25, 'h'],
        [0x1E27, 'h'],
        [0x1E29, 'h'],
        [0x1E2B, 'h'],
        [0x1E96, 'h'],
        [0x24D7, 'h'],
        [0x2C68, 'h'],
        [0x2C76, 'h'],
        [0xFF48, 'h'],
        [0x1F6, 'HV'],
        [0x24A3, '(h)'],
        [0x195, 'hv'],
        [0xCC, 'I'],
        [0xCD, 'I'],
        [0xCE, 'I'],
        [0xCF, 'I'],
        [0x128, 'I'],
        [0x12A, 'I'],
        [0x12C, 'I'],
        [0x12E, 'I'],
        [0x130, 'I'],
        [0x196, 'I'],
        [0x197, 'I'],
        [0x1CF, 'I'],
        [0x208, 'I'],
        [0x20A, 'I'],
        [0x26A, 'I'],
        [0x1D7B, 'I'],
        [0x1E2C, 'I'],
        [0x1E2E, 'I'],
        [0x1EC8, 'I'],
        [0x1ECA, 'I'],
        [0x24BE, 'I'],
        [0xA7FE, 'I'],
        [0xFF29, 'I'],
        [0xEC, 'i'],
        [0xED, 'i'],
        [0xEE, 'i'],
        [0xEF, 'i'],
        [0x129, 'i'],
        [0x12B, 'i'],
        [0x12D, 'i'],
        [0x12F, 'i'],
        [0x131, 'i'],
        [0x1D0, 'i'],
        [0x209, 'i'],
        [0x20B, 'i'],
        [0x268, 'i'],
        [0x1D09, 'i'],
        [0x1D62, 'i'],
        [0x1D7C, 'i'],
        [0x1D96, 'i'],
        [0x1E2D, 'i'],
        [0x1E2F, 'i'],
        [0x1EC9, 'i'],
        [0x1ECB, 'i'],
        [0x2071, 'i'],
        [0x24D8, 'i'],
        [0xFF49, 'i'],
        [0x132, 'IJ'],
        [0x24A4, '(i)'],
        [0x133, 'ij'],
        [0x134, 'J'],
        [0x248, 'J'],
        [0x1D0A, 'J'],
        [0x24BF, 'J'],
        [0xFF2A, 'J'],
        [0x135, 'j'],
        [0x1F0, 'j'],
        [0x237, 'j'],
        [0x249, 'j'],
        [0x25F, 'j'],
        [0x284, 'j'],
        [0x29D, 'j'],
        [0x24D9, 'j'],
        [0x2C7C, 'j'],
        [0xFF4A, 'j'],
        [0x24A5, '(j)'],
        [0x136, 'K'],
        [0x198, 'K'],
        [0x1E8, 'K'],
        [0x1D0B, 'K'],
        [0x1E30, 'K'],
        [0x1E32, 'K'],
        [0x1E34, 'K'],
        [0x24C0, 'K'],
        [0x2C69, 'K'],
        [0xA740, 'K'],
        [0xA742, 'K'],
        [0xA744, 'K'],
        [0xFF2B, 'K'],
        [0x137, 'k'],
        [0x199, 'k'],
        [0x1E9, 'k'],
        [0x29E, 'k'],
        [0x1D84, 'k'],
        [0x1E31, 'k'],
        [0x1E33, 'k'],
        [0x1E35, 'k'],
        [0x24DA, 'k'],
        [0x2C6A, 'k'],
        [0xA741, 'k'],
        [0xA743, 'k'],
        [0xA745, 'k'],
        [0xFF4B, 'k'],
        [0x24A6, '(k)'],
        [0x139, 'L'],
        [0x13B, 'L'],
        [0x13D, 'L'],
        [0x13F, 'L'],
        [0x141, 'L'],
        [0x23D, 'L'],
        [0x29F, 'L'],
        [0x1D0C, 'L'],
        [0x1E36, 'L'],
        [0x1E38, 'L'],
        [0x1E3A, 'L'],
        [0x1E3C, 'L'],
        [0x24C1, 'L'],
        [0x2C60, 'L'],
        [0x2C62, 'L'],
        [0xA746, 'L'],
        [0xA748, 'L'],
        [0xA780, 'L'],
        [0xFF2C, 'L'],
        [0x13A, 'l'],
        [0x13C, 'l'],
        [0x13E, 'l'],
        [0x140, 'l'],
        [0x142, 'l'],
        [0x19A, 'l'],
        [0x234, 'l'],
        [0x26B, 'l'],
        [0x26C, 'l'],
        [0x26D, 'l'],
        [0x1D85, 'l'],
        [0x1E37, 'l'],
        [0x1E39, 'l'],
        [0x1E3B, 'l'],
        [0x1E3D, 'l'],
        [0x24DB, 'l'],
        [0x2C61, 'l'],
        [0xA747, 'l'],
        [0xA749, 'l'],
        [0xA781, 'l'],
        [0xFF4C, 'l'],
        [0x1C7, 'LJ'],
        [0x1EFA, 'LL'],
        [0x1C8, 'Lj'],
        [0x24A7, '(l)'],
        [0x1C9, 'lj'],
        [0x1EFB, 'll'],
        [0x2AA, 'ls'],
        [0x2AB, 'lz'],
        [0x19C, 'M'],
        [0x1D0D, 'M'],
        [0x1E3E, 'M'],
        [0x1E40, 'M'],
        [0x1E42, 'M'],
        [0x24C2, 'M'],
        [0x2C6E, 'M'],
        [0xA7FD, 'M'],
        [0xA7FF, 'M'],
        [0xFF2D, 'M'],
        [0x26F, 'm'],
        [0x270, 'm'],
        [0x271, 'm'],
        [0x1D6F, 'm'],
        [0x1D86, 'm'],
        [0x1E3F, 'm'],
        [0x1E41, 'm'],
        [0x1E43, 'm'],
        [0x24DC, 'm'],
        [0xFF4D, 'm'],
        [0x24A8, '(m)'],
        [0xD1, 'N'],
        [0x143, 'N'],
        [0x145, 'N'],
        [0x147, 'N'],
        [0x14A, 'N'],
        [0x19D, 'N'],
        [0x1F8, 'N'],
        [0x220, 'N'],
        [0x274, 'N'],
        [0x1D0E, 'N'],
        [0x1E44, 'N'],
        [0x1E46, 'N'],
        [0x1E48, 'N'],
        [0x1E4A, 'N'],
        [0x24C3, 'N'],
        [0xFF2E, 'N'],
        [0xF1, 'n'],
        [0x144, 'n'],
        [0x146, 'n'],
        [0x148, 'n'],
        [0x149, 'n'],
        [0x14B, 'n'],
        [0x19E, 'n'],
        [0x1F9, 'n'],
        [0x235, 'n'],
        [0x272, 'n'],
        [0x273, 'n'],
        [0x1D70, 'n'],
        [0x1D87, 'n'],
        [0x1E45, 'n'],
        [0x1E47, 'n'],
        [0x1E49, 'n'],
        [0x1E4B, 'n'],
        [0x207F, 'n'],
        [0x24DD, 'n'],
        [0xFF4E, 'n'],
        [0x1CA, 'NJ'],
        [0x1CB, 'Nj'],
        [0x24A9, '(n)'],
        [0x1CC, 'nj'],
        [0xD2, 'O'],
        [0xD3, 'O'],
        [0xD4, 'O'],
        [0xD5, 'O'],
        [0xD6, 'O'],
        [0xD8, 'O'],
        [0x14C, 'O'],
        [0x14E, 'O'],
        [0x150, 'O'],
        [0x186, 'O'],
        [0x19F, 'O'],
        [0x1A0, 'O'],
        [0x1D1, 'O'],
        [0x1EA, 'O'],
        [0x1EC, 'O'],
        [0x1FE, 'O'],
        [0x20C, 'O'],
        [0x20E, 'O'],
        [0x22A, 'O'],
        [0x22C, 'O'],
        [0x22E, 'O'],
        [0x230, 'O'],
        [0x1D0F, 'O'],
        [0x1D10, 'O'],
        [0x1E4C, 'O'],
        [0x1E4E, 'O'],
        [0x1E50, 'O'],
        [0x1E52, 'O'],
        [0x1ECC, 'O'],
        [0x1ECE, 'O'],
        [0x1ED0, 'O'],
        [0x1ED2, 'O'],
        [0x1ED4, 'O'],
        [0x1ED6, 'O'],
        [0x1ED8, 'O'],
        [0x1EDA, 'O'],
        [0x1EDC, 'O'],
        [0x1EDE, 'O'],
        [0x1EE0, 'O'],
        [0x1EE2, 'O'],
        [0x24C4, 'O'],
        [0xA74A, 'O'],
        [0xA74C, 'O'],
        [0xFF2F, 'O'],
        [0xF2, 'o'],
        [0xF3, 'o'],
        [0xF4, 'o'],
        [0xF5, 'o'],
        [0xF6, 'o'],
        [0xF8, 'o'],
        [0x14D, 'o'],
        [0x14F, 'o'],
        [0x151, 'o'],
        [0x1A1, 'o'],
        [0x1D2, 'o'],
        [0x1EB, 'o'],
        [0x1ED, 'o'],
        [0x1FF, 'o'],
        [0x20D, 'o'],
        [0x20F, 'o'],
        [0x22B, 'o'],
        [0x22D, 'o'],
        [0x22F, 'o'],
        [0x231, 'o'],
        [0x254, 'o'],
        [0x275, 'o'],
        [0x1D16, 'o'],
        [0x1D17, 'o'],
        [0x1D97, 'o'],
        [0x1E4D, 'o'],
        [0x1E4F, 'o'],
        [0x1E51, 'o'],
        [0x1E53, 'o'],
        [0x1ECD, 'o'],
        [0x1ECF, 'o'],
        [0x1ED1, 'o'],
        [0x1ED3, 'o'],
        [0x1ED5, 'o'],
        [0x1ED7, 'o'],
        [0x1ED9, 'o'],
        [0x1EDB, 'o'],
        [0x1EDD, 'o'],
        [0x1EDF, 'o'],
        [0x1EE1, 'o'],
        [0x1EE3, 'o'],
        [0x2092, 'o'],
        [0x24DE, 'o'],
        [0x2C7A, 'o'],
        [0xA74B, 'o'],
        [0xA74D, 'o'],
        [0xFF4F, 'o'],
        [0x152, 'OE'],
        [0x276, 'OE'],
        [0xA74E, 'OO'],
        [0x222, 'OU'],
        [0x1D15, 'OU'],
        [0x24AA, '(o)'],
        [0x153, 'oe'],
        [0x1D14, 'oe'],
        [0xA74F, 'oo'],
        [0x223, 'ou'],
        [0x1A4, 'P'],
        [0x1D18, 'P'],
        [0x1E54, 'P'],
        [0x1E56, 'P'],
        [0x24C5, 'P'],
        [0x2C63, 'P'],
        [0xA750, 'P'],
        [0xA752, 'P'],
        [0xA754, 'P'],
        [0xFF30, 'P'],
        [0x1A5, 'p'],
        [0x1D71, 'p'],
        [0x1D7D, 'p'],
        [0x1D88, 'p'],
        [0x1E55, 'p'],
        [0x1E57, 'p'],
        [0x24DF, 'p'],
        [0xA751, 'p'],
        [0xA753, 'p'],
        [0xA755, 'p'],
        [0xA7FC, 'p'],
        [0xFF50, 'p'],
        [0x24AB, '(p)'],
        [0x24A, 'Q'],
        [0x24C6, 'Q'],
        [0xA756, 'Q'],
        [0xA758, 'Q'],
        [0xFF31, 'Q'],
        [0x138, 'q'],
        [0x24B, 'q'],
        [0x2A0, 'q'],
        [0x24E0, 'q'],
        [0xA757, 'q'],
        [0xA759, 'q'],
        [0xFF51, 'q'],
        [0x24AC, '(q)'],
        [0x239, 'qp'],
        [0x154, 'R'],
        [0x156, 'R'],
        [0x158, 'R'],
        [0x210, 'R'],
        [0x212, 'R'],
        [0x24C, 'R'],
        [0x280, 'R'],
        [0x281, 'R'],
        [0x1D19, 'R'],
        [0x1D1A, 'R'],
        [0x1E58, 'R'],
        [0x1E5A, 'R'],
        [0x1E5C, 'R'],
        [0x1E5E, 'R'],
        [0x24C7, 'R'],
        [0x2C64, 'R'],
        [0xA75A, 'R'],
        [0xA782, 'R'],
        [0xFF32, 'R'],
        [0x155, 'r'],
        [0x157, 'r'],
        [0x159, 'r'],
        [0x211, 'r'],
        [0x213, 'r'],
        [0x24D, 'r'],
        [0x27C, 'r'],
        [0x27D, 'r'],
        [0x27E, 'r'],
        [0x27F, 'r'],
        [0x1D63, 'r'],
        [0x1D72, 'r'],
        [0x1D73, 'r'],
        [0x1D89, 'r'],
        [0x1E59, 'r'],
        [0x1E5B, 'r'],
        [0x1E5D, 'r'],
        [0x1E5F, 'r'],
        [0x24E1, 'r'],
        [0xA75B, 'r'],
        [0xA783, 'r'],
        [0xFF52, 'r'],
        [0x24AD, '(r)'],
        [0x15A, 'S'],
        [0x15C, 'S'],
        [0x15E, 'S'],
        [0x160, 'S'],
        [0x218, 'S'],
        [0x1E60, 'S'],
        [0x1E62, 'S'],
        [0x1E64, 'S'],
        [0x1E66, 'S'],
        [0x1E68, 'S'],
        [0x24C8, 'S'],
        [0xA731, 'S'],
        [0xA785, 'S'],
        [0xFF33, 'S'],
        [0x15B, 's'],
        [0x15D, 's'],
        [0x15F, 's'],
        [0x161, 's'],
        [0x17F, 's'],
        [0x219, 's'],
        [0x23F, 's'],
        [0x282, 's'],
        [0x1D74, 's'],
        [0x1D8A, 's'],
        [0x1E61, 's'],
        [0x1E63, 's'],
        [0x1E65, 's'],
        [0x1E67, 's'],
        [0x1E69, 's'],
        [0x1E9C, 's'],
        [0x1E9D, 's'],
        [0x24E2, 's'],
        [0xA784, 's'],
        [0xFF53, 's'],
        [0x1E9E, 'SS'],
        [0x24AE, '(s)'],
        [0xDF, 'ss'],
        [0xFB06, 'st'],
        [0x162, 'T'],
        [0x164, 'T'],
        [0x166, 'T'],
        [0x1AC, 'T'],
        [0x1AE, 'T'],
        [0x21A, 'T'],
        [0x23E, 'T'],
        [0x1D1B, 'T'],
        [0x1E6A, 'T'],
        [0x1E6C, 'T'],
        [0x1E6E, 'T'],
        [0x1E70, 'T'],
        [0x24C9, 'T'],
        [0xA786, 'T'],
        [0xFF34, 'T'],
        [0x163, 't'],
        [0x165, 't'],
        [0x167, 't'],
        [0x1AB, 't'],
        [0x1AD, 't'],
        [0x21B, 't'],
        [0x236, 't'],
        [0x287, 't'],
        [0x288, 't'],
        [0x1D75, 't'],
        [0x1E6B, 't'],
        [0x1E6D, 't'],
        [0x1E6F, 't'],
        [0x1E71, 't'],
        [0x1E97, 't'],
        [0x24E3, 't'],
        [0x2C66, 't'],
        [0xFF54, 't'],
        [0xDE, 'TH'],
        [0xA766, 'TH'],
        [0xA728, 'TZ'],
        [0x24AF, '(t)'],
        [0x2A8, 'tc'],
        [0xFE, 'th'],
        [0x1D7A, 'th'],
        [0xA767, 'th'],
        [0x2A6, 'ts'],
        [0xA729, 'tz'],
        [0xD9, 'U'],
        [0xDA, 'U'],
        [0xDB, 'U'],
        [0xDC, 'U'],
        [0x168, 'U'],
        [0x16A, 'U'],
        [0x16C, 'U'],
        [0x16E, 'U'],
        [0x170, 'U'],
        [0x172, 'U'],
        [0x1AF, 'U'],
        [0x1D3, 'U'],
        [0x1D5, 'U'],
        [0x1D7, 'U'],
        [0x1D9, 'U'],
        [0x1DB, 'U'],
        [0x214, 'U'],
        [0x216, 'U'],
        [0x244, 'U'],
        [0x1D1C, 'U'],
        [0x1D7E, 'U'],
        [0x1E72, 'U'],
        [0x1E74, 'U'],
        [0x1E76, 'U'],
        [0x1E78, 'U'],
        [0x1E7A, 'U'],
        [0x1EE4, 'U'],
        [0x1EE6, 'U'],
        [0x1EE8, 'U'],
        [0x1EEA, 'U'],
        [0x1EEC, 'U'],
        [0x1EEE, 'U'],
        [0x1EF0, 'U'],
        [0x24CA, 'U'],
        [0xFF35, 'U'],
        [0xF9, 'u'],
        [0xFA, 'u'],
        [0xFB, 'u'],
        [0xFC, 'u'],
        [0x169, 'u'],
        [0x16B, 'u'],
        [0x16D, 'u'],
        [0x16F, 'u'],
        [0x171, 'u'],
        [0x173, 'u'],
        [0x1B0, 'u'],
        [0x1D4, 'u'],
        [0x1D6, 'u'],
        [0x1D8, 'u'],
        [0x1DA, 'u'],
        [0x1DC, 'u'],
        [0x215, 'u'],
        [0x217, 'u'],
        [0x289, 'u'],
        [0x1D64, 'u'],
        [0x1D99, 'u'],
        [0x1E73, 'u'],
        [0x1E75, 'u'],
        [0x1E77, 'u'],
        [0x1E79, 'u'],
        [0x1E7B, 'u'],
        [0x1EE5, 'u'],
        [0x1EE7, 'u'],
        [0x1EE9, 'u'],
        [0x1EEB, 'u'],
        [0x1EED, 'u'],
        [0x1EEF, 'u'],
        [0x1EF1, 'u'],
        [0x24E4, 'u'],
        [0xFF55, 'u'],
        [0x24B0, '(u)'],
        [0x1D6B, 'ue'],
        [0x1B2, 'V'],
        [0x245, 'V'],
        [0x1D20, 'V'],
        [0x1E7C, 'V'],
        [0x1E7E, 'V'],
        [0x1EFC, 'V'],
        [0x24CB, 'V'],
        [0xA75E, 'V'],
        [0xA768, 'V'],
        [0xFF36, 'V'],
        [0x28B, 'v'],
        [0x28C, 'v'],
        [0x1D65, 'v'],
        [0x1D8C, 'v'],
        [0x1E7D, 'v'],
        [0x1E7F, 'v'],
        [0x24E5, 'v'],
        [0x2C71, 'v'],
        [0x2C74, 'v'],
        [0xA75F, 'v'],
        [0xFF56, 'v'],
        [0xA760, 'VY'],
        [0x24B1, '(v)'],
        [0xA761, 'vy'],
        [0x174, 'W'],
        [0x1F7, 'W'],
        [0x1D21, 'W'],
        [0x1E80, 'W'],
        [0x1E82, 'W'],
        [0x1E84, 'W'],
        [0x1E86, 'W'],
        [0x1E88, 'W'],
        [0x24CC, 'W'],
        [0x2C72, 'W'],
        [0xFF37, 'W'],
        [0x175, 'w'],
        [0x1BF, 'w'],
        [0x28D, 'w'],
        [0x1E81, 'w'],
        [0x1E83, 'w'],
        [0x1E85, 'w'],
        [0x1E87, 'w'],
        [0x1E89, 'w'],
        [0x1E98, 'w'],
        [0x24E6, 'w'],
        [0x2C73, 'w'],
        [0xFF57, 'w'],
        [0x24B2, '(w)'],
        [0x1E8A, 'X'],
        [0x1E8C, 'X'],
        [0x24CD, 'X'],
        [0xFF38, 'X'],
        [0x1D8D, 'x'],
        [0x1E8B, 'x'],
        [0x1E8D, 'x'],
        [0x2093, 'x'],
        [0x24E7, 'x'],
        [0xFF58, 'x'],
        [0x24B3, '(x)'],
        [0xDD, 'Y'],
        [0x176, 'Y'],
        [0x178, 'Y'],
        [0x1B3, 'Y'],
        [0x232, 'Y'],
        [0x24E, 'Y'],
        [0x28F, 'Y'],
        [0x1E8E, 'Y'],
        [0x1EF2, 'Y'],
        [0x1EF4, 'Y'],
        [0x1EF6, 'Y'],
        [0x1EF8, 'Y'],
        [0x1EFE, 'Y'],
        [0x24CE, 'Y'],
        [0xFF39, 'Y'],
        [0xFD, 'y'],
        [0xFF, 'y'],
        [0x177, 'y'],
        [0x1B4, 'y'],
        [0x233, 'y'],
        [0x24F, 'y'],
        [0x28E, 'y'],
        [0x1E8F, 'y'],
        [0x1E99, 'y'],
        [0x1EF3, 'y'],
        [0x1EF5, 'y'],
        [0x1EF7, 'y'],
        [0x1EF9, 'y'],
        [0x1EFF, 'y'],
        [0x24E8, 'y'],
        [0xFF59, 'y'],
        [0x24B4, '(y)'],
        [0x179, 'Z'],
        [0x17B, 'Z'],
        [0x17D, 'Z'],
        [0x1B5, 'Z'],
        [0x21C, 'Z'],
        [0x224, 'Z'],
        [0x1D22, 'Z'],
        [0x1E90, 'Z'],
        [0x1E92, 'Z'],
        [0x1E94, 'Z'],
        [0x24CF, 'Z'],
        [0x2C6B, 'Z'],
        [0xA762, 'Z'],
        [0xFF3A, 'Z'],
        [0x17A, 'z'],
        [0x17C, 'z'],
        [0x17E, 'z'],
        [0x1B6, 'z'],
        [0x21D, 'z'],
        [0x225, 'z'],
        [0x240, 'z'],
        [0x290, 'z'],
        [0x291, 'z'],
        [0x1D76, 'z'],
        [0x1D8E, 'z'],
        [0x1E91, 'z'],
        [0x1E93, 'z'],
        [0x1E95, 'z'],
        [0x24E9, 'z'],
        [0x2C6C, 'z'],
        [0xA763, 'z'],
        [0xFF5A, 'z'],
        [0x24B5, '(z)'],
        [0x2070, '0'],
        [0x2080, '0'],
        [0x24EA, '0'],
        [0x24FF, '0'],
        [0xFF10, '0'],
        [0xB9, '1'],
        [0x2081, '1'],
        [0x2460, '1'],
        [0x24F5, '1'],
        [0x2776, '1'],
        [0x2780, '1'],
        [0x278A, '1'],
        [0xFF11, '1'],
        [0x2488, '1.'],
        [0x2474, '(1)'],
        [0xB2, '2'],
        [0x2082, '2'],
        [0x2461, '2'],
        [0x24F6, '2'],
        [0x2777, '2'],
        [0x2781, '2'],
        [0x278B, '2'],
        [0xFF12, '2'],
        [0x2489, '2.'],
        [0x2475, '(2)'],
        [0xB3, '3'],
        [0x2083, '3'],
        [0x2462, '3'],
        [0x24F7, '3'],
        [0x2778, '3'],
        [0x2782, '3'],
        [0x278C, '3'],
        [0xFF13, '3'],
        [0x248A, '3.'],
        [0x2476, '(3)'],
        [0x2074, '4'],
        [0x2084, '4'],
        [0x2463, '4'],
        [0x24F8, '4'],
        [0x2779, '4'],
        [0x2783, '4'],
        [0x278D, '4'],
        [0xFF14, '4'],
        [0x248B, '4.'],
        [0x2477, '(4)'],
        [0x2075, '5'],
        [0x2085, '5'],
        [0x2464, '5'],
        [0x24F9, '5'],
        [0x277A, '5'],
        [0x2784, '5'],
        [0x278E, '5'],
        [0xFF15, '5'],
        [0x248C, '5.'],
        [0x2478, '(5)'],
        [0x2076, '6'],
        [0x2086, '6'],
        [0x2465, '6'],
        [0x24FA, '6'],
        [0x277B, '6'],
        [0x2785, '6'],
        [0x278F, '6'],
        [0xFF16, '6'],
        [0x248D, '6.'],
        [0x2479, '(6)'],
        [0x2077, '7'],
        [0x2087, '7'],
        [0x2466, '7'],
        [0x24FB, '7'],
        [0x277C, '7'],
        [0x2786, '7'],
        [0x2790, '7'],
        [0xFF17, '7'],
        [0x248E, '7.'],
        [0x247A, '(7)'],
        [0x2078, '8'],
        [0x2088, '8'],
        [0x2467, '8'],
        [0x24FC, '8'],
        [0x277D, '8'],
        [0x2787, '8'],
        [0x2791, '8'],
        [0xFF18, '8'],
        [0x248F, '8.'],
        [0x247B, '(8)'],
        [0x2079, '9'],
        [0x2089, '9'],
        [0x2468, '9'],
        [0x24FD, '9'],
        [0x277E, '9'],
        [0x2788, '9'],
        [0x2792, '9'],
        [0xFF19, '9'],
        [0x2490, '9.'],
        [0x247C, '(9)'],
        [0x2469, '10'],
        [0x24FE, '10'],
        [0x277F, '10'],
        [0x2789, '10'],
        [0x2793, '10'],
        [0x2491, '10.'],
        [0x247D, '(10)'],
        [0x246A, '11'],
        [0x24EB, '11'],
        [0x2492, '11.'],
        [0x247E, '(11)'],
        [0x246B, '12'],
        [0x24EC, '12'],
        [0x2493, '12.'],
        [0x247F, '(12)'],
        [0x246C, '13'],
        [0x24ED, '13'],
        [0x2494, '13.'],
        [0x2480, '(13)'],
        [0x246D, '14'],
        [0x24EE, '14'],
        [0x2495, '14.'],
        [0x2481, '(14)'],
        [0x246E, '15'],
        [0x24EF, '15'],
        [0x2496, '15.'],
        [0x2482, '(15)'],
        [0x246F, '16'],
        [0x24F0, '16'],
        [0x2497, '16.'],
        [0x2483, '(16)'],
        [0x2470, '17'],
        [0x24F1, '17'],
        [0x2498, '17.'],
        [0x2484, '(17)'],
        [0x2471, '18'],
        [0x24F2, '18'],
        [0x2499, '18.'],
        [0x2485, '(18)'],
        [0x2472, '19'],
        [0x24F3, '19'],
        [0x249A, '19.'],
        [0x2486, '(19)'],
        [0x2473, '20'],
        [0x24F4, '20'],
        [0x249B, '20.'],
        [0x2487, '(20)'],
        [0xAB, '"'],
        [0xBB, '"'],
        [0x201C, '"'],
        [0x201D, '"'],
        [0x201E, '"'],
        [0x2033, '"'],
        [0x2036, '"'],
        [0x275D, '"'],
        [0x275E, '"'],
        [0x276E, '"'],
        [0x276F, '"'],
        [0xFF02, '"'],
        [0x2018, '\''],
        [0x2019, '\''],
        [0x201A, '\''],
        [0x201B, '\''],
        [0x2032, '\''],
        [0x2035, '\''],
        [0x2039, '\''],
        [0x203A, '\''],
        [0x275B, '\''],
        [0x275C, '\''],
        [0xFF07, '\''],
        [0x2010, '-'],
        [0x2011, '-'],
        [0x2012, '-'],
        [0x2013, '-'],
        [0x2014, '-'],
        [0x207B, '-'],
        [0x208B, '-'],
        [0xFF0D, '-'],
        [0x2045, '['],
        [0x2772, '['],
        [0xFF3B, '['],
        [0x2046, ']'],
        [0x2773, ']'],
        [0xFF3D, ']'],
        [0x207D, '('],
        [0x208D, '('],
        [0x2768, '('],
        [0x276A, '('],
        [0xFF08, '('],
        [0x2E28, '(('],
        [0x207E, ')'],
        [0x208E, ')'],
        [0x2769, ')'],
        [0x276B, ')'],
        [0xFF09, ')'],
        [0x2E29, '))'],
        [0x276C, '<'],
        [0x2770, '<'],
        [0xFF1C, '<'],
        [0x276D, '>'],
        [0x2771, '>'],
        [0xFF1E, '>'],
        [0x2774, '{'],
        [0xFF5B, '{'],
        [0x2775, '}'],
        [0xFF5D, '}'],
        [0x207A, '+'],
        [0x208A, '+'],
        [0xFF0B, '+'],
        [0x207C, '='],
        [0x208C, '='],
        [0xFF1D, '='],
        [0xFF01, '!'],
        [0x203C, '!!'],
        [0x2049, '!?'],
        [0xFF03, '#'],
        [0xFF04, '$'],
        [0x2052, '%'],
        [0xFF05, '%'],
        [0xFF06, '&'],
        [0x204E, '*'],
        [0xFF0A, '*'],
        [0xFF0C, ','],
        [0xFF0E, '.'],
        [0x2044, '/'],
        [0xFF0F, '/'],
        [0xFF1A, ':'],
        [0x204F, ';'],
        [0xFF1B, ';'],
        [0xFF1F, '?'],
        [0x2047, '??'],
        [0x2048, '?!'],
        [0xFF20, '@'],
        [0xFF3C, '\\'],
        [0x2038, '^'],
        [0xFF3E, '^'],
        [0xFF3F, '_'],
        [0x2053, '~'],
        [0xFF5E, '~']
    ]);
}

module.exports = ASCIIFolder;