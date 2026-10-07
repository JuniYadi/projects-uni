; UniVPN NSIS Installer Hook for Windows Background Service
; Installs and registers UniVPN Windows Service during installer execution (with elevated UAC),
; and grants non-admin users (Authenticated Users & Built-in Users) permission to start/stop the service.

!macro customInstall
  DetailPrint "Configuring UniVPN Windows Tunnel Service..."
  
  ; Stop and delete previous service if exists
  nsExec::Exec 'sc.exe stop UniVPNService'
  nsExec::Exec 'sc.exe delete UniVPNService'
  
  ; Ensure ProgramData config folder exists for tunnel configuration
  CreateDirectory "$COMMONAPPDATA\UniVPN"
  ; Grant all users write permissions to the config directory so the unprivileged GUI can update the config
  nsExec::Exec 'icacls.exe "$COMMONAPPDATA\UniVPN" /grant *S-1-5-32-545:(OI)(CI)M /T'

  ; Create Windows Service pointing to wg-helper.exe
  ; SERVICE_WIN32_OWN_PROCESS, start= demand (started on demand by GUI)
  ; Dependencies: Nsi and TcpIp
  nsExec::Exec 'sc.exe create UniVPNService binPath= "\"$INSTDIR\resources\win\wg-helper.exe\" service" start= demand type= own depend= Nsi/TcpIp DisplayName= "UniVPN Tunnel Service"'
  
  ; Set unrestricted service SID type (crucial for WireGuard driver network adapter operations)
  nsExec::Exec 'sc.exe sidtype UniVPNService unrestricted'
  
  ; Set service description
  nsExec::Exec 'sc.exe description UniVPNService "Background WireGuard tunnel service for UniVPN client."'

  ; Set Service Security Descriptor (SDDL) so standard non-admin users (AU: Authenticated Users, BU: Built-in Users)
  ; can start, stop, query status, and send custom control codes without requiring UAC elevation.
  ;
  ; SDDL Components:
  ; D: (DACL)
  ; (A;;CCLCSWLOCRRC;;;AU)  - Authenticated Users: Query config, query status, enumerate, user control, read
  ; (A;;RPWPCR;;;AU)        - Authenticated Users: Start (RP), Stop (WP), User Defined Control (CR)
  ; (A;;RPWPCR;;;BU)        - Built-in Users: Start (RP), Stop (WP), User Defined Control (CR)
  ; (A;;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;BA) - Built-in Admins: Full Control
  ; (A;;CCLCSWRPWPDTLOCRRC;;;SY)         - Local System: Full Control
  nsExec::Exec 'sc.exe sdset UniVPNService "D:(A;;CCLCSWLOCRRC;;;AU)(A;;RPWPCR;;;AU)(A;;RPWPCR;;;BU)(A;;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;BA)(A;;CCLCSWRPWPDTLOCRRC;;;SY)"'

  DetailPrint "UniVPN Windows Tunnel Service successfully registered."
!macroend

!macro customUnInstall
  DetailPrint "Removing UniVPN Windows Tunnel Service..."
  nsExec::Exec 'sc.exe stop UniVPNService'
  nsExec::Exec 'sc.exe delete UniVPNService'
  RMDir /r "$COMMONAPPDATA\UniVPN"
  DetailPrint "UniVPN Windows Tunnel Service removed."
!macroend
