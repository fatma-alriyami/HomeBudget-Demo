using System.ComponentModel.DataAnnotations;

namespace HomeBudget.API.DTOs
{
    public class BudgetUpdateDto
    {
        [Range(typeof(decimal), "0.001", "999999999999999.999")]
        public decimal Amount { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }
    }
}