export interface LocalDevProxyRule {
  /**
   * @description [ko] 고유 키 - 같은 키로 요청이 오는경우 overwrite 됩니다. 동시에 2
   * @description [en] Unique key - requests with the same key will be overwritten
   */
  key: string;
  /**
   * @description [ko] https 사용 여부
   * @description [en] Use of https
   * @default false
   */
  https?: boolean;
  /**
   * @description [ko] 라우팅 기준이 될 Hostname
   * @description [en] Hostname used as routing criteria
   * @example www.local.your-domain.com
   */
  host: string;
  /**
   * @description [ko] 우선순위 - 여러개의 규칙이 있는 경우 우선순위값이 작을수록 먼저 적용됩니다
   * @description [en] Priority - When there are multiple rules, the one with the lower priority value is applied first
   */
  priority?: number;
  /**
   * @description [ko] path 기준 조건
   * @description [en] Path criteria
   */
  path?: RegExp | string;
  /**
   * @description [ko] referer 헤더값 기준 조건
   * @description [en] Criteria based on the referer header value
   */
  referrer?: RegExp;
  /**
   * @description [ko] path rewrite가 필요한 경우 사용
   * @description [en] Used for path rewrite if needed
   */
  pathRewrite?: { [key: string]: string };
}

export interface LocalDevProxySubRule extends Omit<LocalDevProxyRule, 'host'> {
  /**
   * @description [ko] 라우팅 기준이 될 Hostname - 미입력시 rule 값을 참조 (rule 이 여러개인 경우 첫번째 값 참조)
   * @description [en] Hostname used as routing criteria - If not entered, the rule value is referenced (the first value is referenced if there are multiple rules)
   * @example www.local.your-domain.com
   */
  host?: string;
  /**
   * @description [ko] 목적지 Origin
   * @description [en] Destination Origin
   * @example https://www.your-domain.com
   */
  targetOrigin: string;
}

export interface LocalDevProxyOption {
  /**
   * @description [ko] 로컬서버가 실행될 포트 - 'auto' 일 경우 실행된 프로세스에서 자동으로 찾습니다. 두개 이상의 서버를 띄워야 하는 경우에만 명시적으로 사용
   * @description [en] Port on which the local server will run - If 'auto', it will automatically find the port from the running process. Used explicitly only when more than one server needs to be launched
   * @default 'auto'
   */
  localServerPort?: 'auto' | number;
  /**
   * @description [ko] 현재 앱의 홈 Path - 최초 실행시 사용
   * @description [en] Home path of the current app - Used at initial run
   * @example '/main'
   * @default '/'
   */
  homePath?: string;
  /**
   * @description [ko] 실행시 브라우저에서 Home path 가 자동으로 열립니다
   * @description [en] Automatically opens the Home path in the browser on start
   * @default true
   */
  openOnStart?: boolean;
  /**
   * @description [ko] 기본규칙 - 이 규칙의 목적지는 현재 앱이 됩니다
   * @description [en] Default rule - The destination of this rule will be the current app
   */
  rule: LocalDevProxyRule | LocalDevProxyRule[];
  /**
   * @description [ko] 보조규칙 - 동일 호스트지만 다른 remote 서버 등을 보는 경우 설정
   * @description [en] Auxiliary rules - Set this when looking at other remote servers with the same host
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
