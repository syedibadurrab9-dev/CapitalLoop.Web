import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PortfolioStore } from '../../store/portfolio.store';

@Component({
  selector: 'app-node-monitor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './node-monitor.component.html',
  //styleUrls: ['./node-monitor.component.scss']
})
export class NodeMonitorComponent {
  /**
   * ✅ Injects the central administrative signals engine.
   * Gives the template fine-grained reactive access to the live node state array:
   * portfolioStore.activeNodeStatusList()
   */
  protected readonly portfolioStore = inject(PortfolioStore);

  /**
   * ✅ Processes emergency administrative price modification injections.
   * Bypasses the active webhook pipelines to alter pricing calculations instantly.
   * * @param nodeId The target broker platform integration key identifier.
   * @param inputRef HTMLInputElement reference used to pull values and handle form flushing.
   */
  protected executeManualOverride(nodeId: string, inputRef: HTMLInputElement): void {
    const rawValue = inputRef.value;
    if (!nodeId || !rawValue) return;

    // Convert raw input text string parameters to explicit real integers
    const calculatedPrice = parseFloat(rawValue);

    if (isNaN(calculatedPrice) || calculatedPrice <= 0) {
      console.warn('⚠️ Gating Fault: Input value must be a valid positive numerical pricing factor.');
      return;
    }

    // Direct the sanitized parameters straight to your global mutator pipeline
    this.portfolioStore.injectManualSpotRate(nodeId, calculatedPrice);

    // Clear input forms cleanly to prevent accidental replay loops
    inputRef.value = '';
    
    console.log(`[NODE_OVERRIDE_SUCCESS] Dispatched manual spot-rate change. Node ID: ${nodeId} -> Value: Rs. ${calculatedPrice}`);
  }
}