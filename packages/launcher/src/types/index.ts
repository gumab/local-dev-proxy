export interface LocalDevProxyRule {
  /**
   * 고유 키 - 같은 키로 요청이 오는경우 overwrite 됩니다
   */
  key: string;
  /**
   * 라우팅 기준이 될 Hostname
   * ex) www.local.kurly.com
   */
  host: string;
  /**
   * 우선순위
   * 여러개의 규칙이 있는 경우 우선순위값이 작을수록 먼저 적용됩니다
   */
  priority?: number;
  /**
   * path 기준 조건
   */
  path?: RegExp | string;
  /**
   * referer 헤더값 기준 조건
   */
  referrer?: RegExp;
  /**
   * path rewrite가 필요한 경우 사용
   */
  pathRewrite?: { [key: string]: string };
}

export interface LocalDevProxySubRule extends LocalDevProxyRule {
  /**
   * 목적지 주소
   */
  target: string;
}

export interface LocalDevProxyOption {
  /**
   * https 사용 여부
   * *.kurly.com / *.kurlycorp.kr / *.kurly.services 지원
   * default: false
   */
  https?: boolean;
  /**
   * 현재 앱의 홈 Path
   * 최초 실행시 사용
   * ex. '/main'
   * default: '/'
   */
  homePath?: string;
  /**
   * 실행시 자동 켜짐
   * default: true
   */
  openOnStart?: boolean;
  /**
   * 기본규칙
   * 이 규칙의 목적지는 현재 앱이 됩니다
   */
  rule: LocalDevProxyRule | LocalDevProxyRule[];
  /**
   * 보조규칙
   * 동일 호스트지만 다른 remote 서버 등을 보는 경우 설정
   */
  subRules?: LocalDevProxySubRule[];
}

export interface RouteRuleRequest {
  key: string;
  https: boolean;
  priority?: number;
  path?: string | null;
  pathRegex?: string | null;
  host: string;
  referrerRegex?: string | null;
  pathRewrite?: { [key: string]: string };
  target: string;
}
