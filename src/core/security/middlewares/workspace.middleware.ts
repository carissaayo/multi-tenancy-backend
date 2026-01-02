// @Injectable()
// export class WorkspaceMiddleware implements NestMiddleware {
//   constructor(
//     private readonly workspaceService: WorkspaceService,
//     private readonly memberService: MemberService,
//   ) {}

//   async use(req: Request, res: Response, next: NextFunction) {
//     // Skip if no authenticated user
//     if (!req.user) {
//       return next();
//     }

//     // Extract workspace from subdomain, header, or body
//     const workspaceSlug =
//       this.extractSubdomain(req) ||
//       req.headers['x-workspace-slug'] ||
//       req.body?.workspaceSlug;

//     if (!workspaceSlug) {
//       return res.status(400).json({
//         success: false,
//         message: 'Workspace context required',
//       });
//     }

//     // Find workspace
//     const workspace = await this.workspaceService.findBySlug(workspaceSlug);
//     if (!workspace || !workspace.is_active) {
//       return res.status(404).json({
//         success: false,
//         message: 'Workspace not found or inactive',
//       });
//     }

//     // Find user's membership in this workspace
//     const member = await this.memberService.findMember(
//       workspace.id,
//       req.user.id,
//     );

//     if (!member || !member.is_active) {
//       return res.status(403).json({
//         success: false,
//         message: 'Not a member of this workspace',
//       });
//     }

//     // Attach to request
//     req.workspace = workspace;
//     req.workspaceMember = member;

//     next();
//   }

//   private extractSubdomain(req: Request): string | null {
//     const host = req.headers.host;
//     if (!host) return null;

//     const parts = host.split('.');
//     if (parts.length > 2) {
//       return parts[0]; // acme.app.com → acme
//     }
//     return null;
//   }
// }
